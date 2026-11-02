import assert from 'node:assert/strict';
import { randomUUID, createHmac, randomBytes, createHash } from 'node:crypto';
import postgres from 'postgres';
import sharp from 'sharp';

process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020';
const network = `chat-image-test-${randomUUID()}`;
const people = [];
const sql = postgres(process.env.CHAT_DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
const fixture = await sharp({
  create: { width: 32, height: 24, channels: 3, background: '#406050' },
})
  .jpeg()
  .withMetadata({ orientation: 6 })
  .withExif({ IFD0: { Artist: 'Test metadata that must be removed' } })
  .toBuffer();
function headers(person) {
  return {
    origin: base,
    'x-vercel-forwarded-for': network,
    ...(person.cookie ? { cookie: person.cookie } : {}),
  };
}
async function call(person, body, path = '/api/chat') {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: { ...headers(person), 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const cookie = response.headers.get('set-cookie');
  if (cookie) person.cookie = cookie.split(';')[0];
  return { status: response.status, data: await response.json() };
}
async function ok(person, body, path) {
  const response = await call(person, body, path);
  assert.equal(response.status, 200, JSON.stringify(response.data));
  return response.data;
}
async function guest(name) {
  const person = {};
  // Operator-only fixture setup, never an HTTP/auth bypass in the application.
  // Use for repeated live checks without consuming the public guest-join quota.
  if (process.env.CHAT_TEST_SEED_GUESTS === '1') {
    const secret = randomBytes(32).toString('base64url');
    const id = randomUUID();
    const digest = createHash('sha256').update(secret).digest('hex');
    await sql`insert into tamil_chat.sessions(id,token_hash,name) values(${id},${digest},${name})`;
    person.cookie = `tamilai_chat=${secret}`;
    person.id = id;
    people.push(person);
    return person;
  }
  await ok(person, { action: 'join', name, accepted: true });
  person.id = (await ok(person)).me.id;
  people.push(person);
  return person;
}
async function upload(person, roomId, bytes = fixture, type = 'image/jpeg') {
  const form = new FormData();
  form.set('roomId', roomId);
  form.set('clientId', randomUUID());
  form.set('image', new Blob([bytes], { type }), 'fixture');
  const response = await fetch(base + '/api/chat/images', {
    method: 'POST',
    headers: headers(person),
    body: form,
  });
  return { status: response.status, data: await response.json() };
}
async function accepted(a, b) {
  const room = await ok(a, { action: 'create' });
  await ok(b, {
    action: 'accept-invite',
    invite: room.invite,
    roomId: room.roomId,
  });
  return room.roomId;
}
async function picture(person, roomId) {
  const result = await upload(person, roomId);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data.messageId;
}
async function cleared(ids) {
  for (const id of ids) {
    const [message] =
      await sql`select image_data,image_type from tamil_chat.messages where id=${id}`;
    if (message) {
      assert.equal(
        message.image_data,
        null,
        'Ended chats must not retain image payloads',
      );
      assert.equal(message.image_type, null);
    }
  }
}
try {
  const a = await guest('ImageTestA');
  const b = await guest('ImageTestB');
  const c = await guest('ImageTestC');
  const waiting = await ok(a, { action: 'create' });
  assert.equal(
    (await upload(a, waiting.roomId)).status,
    403,
    'No uploads before acceptance',
  );
  assert.equal(
    (await ok({}, { action: 'resolve-invite', invite: waiting.invite })).roomId,
    waiting.roomId,
  );
  assert.equal(
    (
      await call(b, {
        action: 'accept-invite',
        invite: waiting.invite,
        roomId: randomUUID(),
      })
    ).status,
    400,
  );
  await ok(b, {
    action: 'accept-invite',
    invite: waiting.invite,
    roomId: waiting.roomId,
  });
  const page = await fetch(`${base}/chat/${waiting.roomId}`);
  assert.equal(page.status, 200);
  assert.ok((await page.text()).includes('noindex'));
  assert.equal((await upload(c, waiting.roomId)).status, 403);
  assert.equal(
    (
      await upload(
        a,
        waiting.roomId,
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
        'image/svg+xml',
      )
    ).status,
    400,
  );
  assert.equal(
    (await upload(a, waiting.roomId, Buffer.alloc(2 * 1024 * 1024 + 1))).status,
    413,
  );
  assert.equal(
    (await upload(a, waiting.roomId, Buffer.from('not really a jpeg'))).status,
    400,
  );
  const id = await picture(a, waiting.roomId);
  const privateUrl = `/api/chat/images/${id}`;
  const visible = await fetch(base + privateUrl, { headers: headers(b) });
  assert.equal(visible.status, 200);
  assert.match(visible.headers.get('cache-control'), /no-store/);
  const processed = Buffer.from(await visible.arrayBuffer());
  const meta = await sharp(processed).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.exif, undefined);
  assert.equal(meta.width, 24);
  assert.equal(meta.height, 32);
  assert.equal(
    (await fetch(base + privateUrl, { headers: headers(c) })).status,
    404,
  );
  assert.equal((await fetch(base + privateUrl)).status, 401);
  const messages = (await ok(b, undefined, `/api/chat?room=${waiting.roomId}`))
    .messages;
  assert.equal(messages.find((m) => m.id === id).has_image, true);
  assert.equal('image_data' in messages[0], false);
  await ok(b, {
    action: 'report',
    roomId: waiting.roomId,
    messageId: id,
    reason: 'Image integration test',
  });
  const mod = {};
  await ok(
    mod,
    { action: 'login', key: process.env.CHAT_MODERATOR_KEY },
    '/api/chat/moderation',
  );
  const report = (
    await ok(mod, undefined, '/api/chat/moderation')
  ).reports.find((r) => r.message_id === id);
  assert.equal(report.has_image, true);
  const modUrl = `/api/chat/moderation/images/${report.id}`;
  assert.equal(
    (await fetch(base + modUrl, { headers: headers(mod) })).status,
    200,
  );
  await ok(a, { action: 'end', roomId: waiting.roomId });
  assert.equal(
    (await fetch(base + privateUrl, { headers: headers(b) })).status,
    404,
  );
  assert.equal(
    (await fetch(base + modUrl, { headers: headers(mod) })).status,
    404,
  );
  await cleared([id]);

  const blockedRoom = await accepted(a, c);
  const blockedId = await picture(a, blockedRoom);
  await ok(c, { action: 'block', roomId: blockedRoom });
  await cleared([blockedId]);
  const logoutRoom = await accepted(a, b);
  const logoutId = await picture(b, logoutRoom);
  await ok(a, { action: 'leave' });
  await cleared([logoutId]);
  const d = await guest('ImageTestD');
  const expiredRoom = await accepted(d, b);
  const expiredId = await picture(d, expiredRoom);
  await sql`update tamil_chat.rooms set expires_at=now()-interval '1 second' where id=${expiredRoom}`;
  assert.equal(
    (
      await fetch(base + `/api/chat/images/${expiredId}`, {
        headers: headers(b),
      })
    ).status,
    404,
  );
  await ok(b);
  await cleared([expiredId]);
  const suspendedRoom = await accepted(d, b);
  const suspendedId = await picture(d, suspendedRoom);
  await ok(b, {
    action: 'report',
    roomId: suspendedRoom,
    messageId: suspendedId,
    reason: 'Image suspension test',
  });
  const suspension = (
    await ok(mod, undefined, '/api/chat/moderation')
  ).reports.find((r) => r.message_id === suspendedId);
  await ok(
    mod,
    { action: 'suspend', reportId: suspension.id },
    '/api/chat/moderation',
  );
  await cleared([suspendedId]);
  await ok(mod, { action: 'logout' }, '/api/chat/moderation');
  console.log(
    'PASS: dedicated private page, legacy invite resolution, invite/path match, consent, upload validation, private access, metadata removal, no-cache delivery, image reports, and database clearing on end/block/logout/expiry/suspension.',
  );
} finally {
  const ids = people.map((p) => p.id);
  if (ids.length) {
    await sql`delete from tamil_chat.reports where reporter_id in ${sql(ids)}`;
    await sql`delete from tamil_chat.sessions where id in ${sql(ids)}`;
    for (const id of ids)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  const digest = createHmac('sha256', process.env.CHAT_RATE_SALT)
    .update(network)
    .digest('hex');
  await sql`delete from tamil_chat.limits where key like ${'%:' + digest}`;
  await sql.end();
}
