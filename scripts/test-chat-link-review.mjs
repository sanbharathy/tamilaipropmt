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
const workspace = await mkdtemp(join(tmpdir(), 'taie-review-test-'));
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
  network = 'link-review-test-' + randomUUID();
const output = createWriteStream(
  '/private/tmp/taie-link-review-test-server.log',
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
  owner = new Map(),
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
try {
  for (let n = 0; n < 80; n++) {
    try {
      if ((await fetch(base + '/taie-contact')).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal((await call(stranger, '/api/chat/contact/review')).status, 401);
  await ok(owner, '/api/chat/contact', {
    action: 'owner-login',
    key,
    accepted: true,
  });
  const digest = createHash('sha256')
    .update(owner.get('tamilai_chat'))
    .digest('hex');
  const [own] =
    await sql`select id from tamil_chat.sessions where token_hash=${digest}`;
  ids.push(own.id);
  for (const [jar, name] of [
    [host, 'ReviewHost'],
    [guest, 'ReviewGuest'],
    [stranger, 'ReviewStranger'],
  ]) {
    await ok(jar, '/api/chat', {
      action: 'join',
      name,
      accepted: true,
      archiveConsent: true,
    });
    ids.push((await ok(jar)).me.id);
  }
  const created = await ok(host, '/api/chat', {
    action: 'create',
    reviewAccepted: true,
  });
  rooms.push(created.roomId);
  const legacy = await ok(stranger, '/api/chat', { action: 'create' });
  rooms.push(legacy.roomId);
  assert.equal(
    (
      await ok(guest, '/api/chat', {
        action: 'preview',
        invite: created.invite,
      })
    ).reviewRequired,
    true,
  );
  assert.equal(
    (
      await call(guest, '/api/chat', {
        action: 'accept-invite',
        invite: created.invite,
      })
    ).status,
    403,
    'guest must explicitly accept admin review',
  );
  await ok(guest, '/api/chat', {
    action: 'accept-invite',
    invite: created.invite,
    reviewAccepted: true,
  });
  await ok(host, '/api/chat', {
    action: 'send',
    roomId: created.roomId,
    clientId: randomUUID(),
    text: 'Synthetic security-review test message',
  });
  const image = await sharp({
    create: { width: 12, height: 12, channels: 3, background: '#335577' },
  })
    .jpeg()
    .toBuffer();
  const form = new FormData();
  form.set('roomId', created.roomId);
  form.set('clientId', randomUUID());
  form.set('image', new Blob([image], { type: 'image/jpeg' }), 'fixture.jpg');
  const sent = await fetch(base + '/api/chat/images', {
    method: 'POST',
    headers: {
      origin: base,
      cookie: [...guest].map(([k, v]) => `${k}=${v}`).join('; '),
      'x-vercel-forwarded-for': network,
    },
    body: form,
  });
  assert.equal(sent.status, 200, await sent.text());
  assert.equal(
    (await call(host, '/api/chat/contact/review?room=' + created.roomId))
      .status,
    401,
    'participants cannot use owner review',
  );
  const review = await ok(
    owner,
    '/api/chat/contact/review?room=' + created.roomId,
  );
  assert.equal(review.messages.length, 2);
  assert.ok(
    review.messages.some(
      (m) => m.body === 'Synthetic security-review test message',
    ),
  );
  assert.ok(
    !review.rooms.some((r) => r.id === legacy.roomId),
    'legacy rooms excluded',
  );
  assert.equal(
    (await call(owner, '/api/chat/contact/review?room=' + legacy.roomId))
      .status,
    404,
  );
  const picture = review.messages.find((m) => m.has_image);
  const pictureUrl = base + '/api/chat/contact/review/image/' + picture.id;
  assert.equal((await fetch(pictureUrl)).status, 401);
  assert.equal(
    (
      await fetch(pictureUrl, {
        headers: { cookie: [...owner].map(([k, v]) => `${k}=${v}`).join('; ') },
      })
    ).status,
    200,
  );
  await sql`update tamil_chat.rooms set status='ended',invite_hash=null where id=${created.roomId}`;
  assert.equal(
    (await call(owner, '/api/chat/contact/review?room=' + created.roomId))
      .status,
    404,
    'ended chats no longer available live',
  );
  assert.equal(
    (
      await fetch(pictureUrl, {
        headers: { cookie: [...owner].map(([k, v]) => `${k}=${v}`).join('; ') },
      })
    ).status,
    404,
  );
  console.log(
    'PASS: private links, mandatory guest review consent, owner-only text/image access, legacy exclusion, and end-of-chat access revocation.',
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
  const networkHash = createHmac('sha256', process.env.CHAT_RATE_SALT)
    .update(network)
    .digest('hex');
  await sql`delete from tamil_chat.limits where key like ${'%' + networkHash}`;
  server.kill('SIGTERM');
  await sql.end();
  output.end();
  await rm(workspace, { recursive: true, force: true });
}
