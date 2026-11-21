import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHmac, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdtemp, cp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';
import postgres from 'postgres';
import sharp from 'sharp';
process.loadEnvFile('.env.chat.local');
const port = await new Promise((resolve) => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1', () => {
    const chosen = socket.address().port;
    socket.close(() => resolve(chosen));
  });
});
const workspace = await mkdtemp(join(tmpdir(), 'taie-image-replacement-test-'));
for (const entry of [
  'app',
  'components',
  'lib',
  'assets',
  'next.config.ts',
  'tsconfig.json',
  'package.json',
  'postcss.config.mjs',
  'components.json',
])
  await cp(entry, join(workspace, entry), { recursive: true });
await symlink(
  join(process.cwd(), 'node_modules'),
  join(workspace, 'node_modules'),
);
await symlink(join(process.cwd(), 'public'), join(workspace, 'public'));
const key = randomBytes(40).toString('base64url'),
  base = 'http://localhost:' + port,
  network = 'image-replacement-test-' + randomUUID();
const output = createWriteStream(
  '/private/tmp/taie-image-replacement-test-server.log',
);
const server = spawn(
  process.execPath,
  [
    join(process.cwd(), 'node_modules/next/dist/bin/next'),
    'dev',
    '--webpack',
    '-p',
    String(port),
  ],
  {
    cwd: workspace,
    env: { ...process.env, TAIE_CONTACT_OWNER_KEY: key },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
server.stdout.pipe(output);
server.stderr.pipe(output);
const sql = postgres(process.env.CHAT_DATABASE_URL, {
  ssl: 'require',
  prepare: false,
  max: 1,
});
const ids = [],
  rooms = [],
  host = new Map(),
  guest = new Map(),
  stranger = new Map();
async function call(jar, path = '/api/chat', body) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    signal: AbortSignal.timeout(30000),
    headers: {
      origin: base,
      'Content-Type': 'application/json',
      'x-vercel-forwarded-for': network,
      cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  for (const item of response.headers.getSetCookie()) {
    const pair = item.split(';')[0],
      at = pair.indexOf('=');
    jar.set(pair.slice(0, at), pair.slice(at + 1));
  }
  return { status: response.status, data: await response.json() };
}
async function ok(jar, path, body) {
  const r = await call(jar, path, body);
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r.data;
}
const fixture = await sharp({
  create: { width: 32, height: 24, channels: 3, background: '#406050' },
})
  .jpeg()
  .toBuffer();
async function upload(
  jar,
  roomId,
  clientId = randomUUID(),
  bytes = fixture,
  caption = 'Replacement test',
) {
  const form = new FormData();
  form.set('roomId', roomId);
  form.set('clientId', clientId);
  form.set('caption', caption);
  form.set('image', new Blob([bytes], { type: 'image/jpeg' }), 'fixture.jpg');
  const response = await fetch(base + '/api/chat/images', {
    method: 'POST',
    headers: {
      origin: base,
      'x-vercel-forwarded-for': network,
      cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    },
    body: form,
  });
  return { status: response.status, data: await response.json() };
}
async function imageStatus(jar, id) {
  return (
    await fetch(base + '/api/chat/images/' + id, {
      headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
    })
  ).status;
}
try {
  let started = false;
  for (let n = 0; n < 80; n++) {
    try {
      if ((await fetch(base + '/taie-contact')).ok) {
        started = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(started, 'isolated test server ready');
  for (const [jar, name] of [
    [host, 'ReplaceHost'],
    [guest, 'ReplaceGuest'],
    [stranger, 'ReplaceOutsider'],
  ]) {
    const secret = randomBytes(32).toString('base64url'),
      id = randomUUID();
    const digest = createHash('sha256').update(secret).digest('hex');
    await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice) values(${id},${digest},${name},true)`;
    ids.push(id);
    jar.set('tamilai_chat', secret);
  }
  const created = await ok(host, '/api/chat', { action: 'create' });
  const roomId = created.roomId;
  rooms.push(roomId);
  await ok(guest, '/api/chat', {
    action: 'accept-invite',
    roomId,
    invite: created.invite,
  });
  const uploaded = [];
  for (let n = 0; n < 12; n++) {
    const clientId = randomUUID();
    const result = await upload(n % 2 ? guest : host, roomId, clientId);
    assert.equal(result.status, 200, JSON.stringify(result.data));
    uploaded.push({
      id: result.data.messageId,
      clientId,
      jar: n % 2 ? guest : host,
    });
  }
  const latest = uploaded.at(-1);
  assert.equal(
    await imageStatus(guest, latest.id),
    200,
    'newest image available',
  );
  assert.equal(await imageStatus(stranger, latest.id), 404, 'outsider denied');
  for (const old of uploaded.slice(0, -1))
    assert.equal(
      await imageStatus(host, old.id),
      404,
      'old image inaccessible',
    );
  const [count] =
    await sql`select count(*)::int as count from tamil_chat.messages where room_id=${roomId} and image_data is not null`;
  assert.equal(count.count, 1, 'only one live image byte payload');
  const state = await ok(host, '/api/chat?room=' + roomId);
  for (const old of uploaded.slice(0, -1)) {
    const message = state.messages.find((m) => m.id === old.id);
    assert.equal(message.image_cleared, true);
    assert.equal(message.has_image, true);
    assert.equal(message.body, 'Replacement test', 'caption retained');
  }
  assert.equal(
    state.messages.find((m) => m.id === latest.id).image_cleared,
    false,
  );
  const retry = await upload(uploaded[0].jar, roomId, uploaded[0].clientId);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.messageId, uploaded[0].id);
  assert.equal(
    await imageStatus(host, latest.id),
    200,
    'retry old upload does not clear newest',
  );
  assert.equal(
    (await upload(host, roomId, randomUUID(), Buffer.from('invalid'))).status,
    400,
  );
  assert.equal(
    await imageStatus(host, latest.id),
    200,
    'invalid upload preserves current image',
  );
  const concurrent = await Promise.all([
    upload(host, roomId),
    upload(guest, roomId),
  ]);
  concurrent.forEach((r) =>
    assert.equal(r.status, 200, JSON.stringify(r.data)),
  );
  const live =
    await sql`select id::text from tamil_chat.messages where room_id=${roomId} and image_data is not null`;
  assert.equal(live.length, 1, 'concurrent uploads serialized');
  assert.ok(concurrent.some((r) => r.data.messageId === live[0].id));
  await sql`update tamil_chat.rooms set status='ended',invite_hash=null where id=${roomId}`;
  const [archive] =
    await sql`select snapshot from tamil_chat.archives where room_id=${roomId}`;
  assert.ok(archive?.snapshot, 'security snapshot created');
  const images = archive.snapshot.messages.filter((m) => m.image);
  assert.equal(images.length, 1, 'future archive contains only newest image');
  assert.equal(images[0].id, live[0].id);
  assert.equal(
    archive.snapshot.messages.length,
    14,
    'all captions remain in archive',
  );
  console.log(
    'PASS: more than 10 uploads, either participant replaces earlier images, one live payload, captions/cleared flag, private access, idempotent retry, failed upload preservation, concurrent replacement, and latest-image-only archive.',
  );
} finally {
  for (const id of rooms) {
    await sql`delete from tamil_chat.rooms where id=${id}`;
    await sql`delete from tamil_chat.archives where room_id=${id}`;
    await sql`delete from tamil_chat.limits where key like ${'%' + id + '%'}`;
  }
  for (const id of ids) {
    await sql`delete from tamil_chat.sessions where id=${id}`;
    await sql`delete from tamil_chat.limits where key like ${'%' + id + '%'}`;
  }
  const hash = createHmac('sha256', process.env.CHAT_RATE_SALT)
    .update(network)
    .digest('hex');
  await sql`delete from tamil_chat.limits where key like ${'%' + hash}`;
  server.kill('SIGTERM');
  await sql.end();
  output.end();
  await rm(workspace, { recursive: true, force: true });
}
