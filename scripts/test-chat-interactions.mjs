import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import postgres from 'postgres';
import sharp from 'sharp';
process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020',
  sql = postgres(process.env.CHAT_DATABASE_URL, {
    ssl: 'require',
    prepare: false,
    max: 1,
  }),
  users = [],
  rooms = [];
async function guest(name) {
  const id = randomUUID(),
    secret = randomBytes(32).toString('base64url');
  users.push(id);
  await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice) values(${id},${createHash('sha256').update(secret).digest('hex')},${name},true)`;
  return { id, cookie: `tamilai_chat=${secret}` };
}
async function call(user, path, body) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: base,
      Cookie: user.cookie,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
async function send(user, text, extra = {}) {
  return call(user, '/api/chat', {
    action: 'send',
    roomId,
    text,
    clientId: randomUUID(),
    ...extra,
  });
}
async function state(user) {
  const result = await call(user, `/api/chat?room=${roomId}`);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  return result.data;
}
async function react(user, target, emoji, extra = {}) {
  return call(user, '/api/chat/reactions', {
    roomId,
    messageId: target,
    emoji,
    clientId: randomUUID(),
    ...extra,
  });
}
let roomId;
try {
  const a = await guest('InteractionTestA'),
    b = await guest('InteractionTestB'),
    c = await guest('InteractionTestOther');
  roomId = randomUUID();
  rooms.push(roomId);
  await sql`insert into tamil_chat.rooms(id,host_id,guest_id,source,status) values(${roomId},${a.id},${b.id},'link','active')`;
  assert.equal((await send(a, 'Which photo should we share?')).status, 200);
  let data = await state(b),
    target = data.messages.at(-1).id;
  assert.equal(
    (await send(b, 'This one! 😊', { replyTo: target })).status,
    200,
  );
  data = await state(a);
  let reply = data.messages.at(-1);
  assert.equal(reply.body, 'This one! 😊');
  assert.equal(reply.reply.id, target);
  assert.equal(reply.reply.sender_id, a.id);
  assert.equal(reply.reply.preview, 'Which photo should we share?');
  assert.equal(
    (await send(b, 'x'.repeat(850), { replyTo: target })).status,
    200,
  );
  assert.equal(
    (await send(b, 'x'.repeat(851), { replyTo: target })).status,
    400,
  );
  assert.equal((await send(a, 'x'.repeat(1200))).status, 200);
  assert.equal((await send(c, 'outsider', { replyTo: target })).status, 404);
  const other = randomUUID();
  rooms.push(other);
  await sql`insert into tamil_chat.rooms(id,host_id,guest_id,source,status) values(${other},${a.id},${c.id},'link','active')`;
  assert.equal(
    (await send(a, 'wrong room', { roomId: other, replyTo: target })).status,
    404,
  );
  const clientId = randomUUID();
  assert.equal((await react(a, target, '❤️', { clientId })).status, 200);
  assert.equal((await react(a, target, '❤️', { clientId })).status, 200);
  assert.equal((await react(b, target, '❤️')).status, 200);
  data = await state(a);
  assert.deepEqual(data.messages.find((m) => m.id === target).reactions, [
    { emoji: '❤️', count: 2, mine: true },
  ]);
  assert.equal(data.reaction_events.length, 2);
  assert.ok(
    data.messages
      .filter((m) => m.reaction_event)
      .every((m) => !m.body.includes('TamilAI reaction v1')),
  );
  assert.equal((await react(a, target, '😘')).status, 200);
  data = await state(a);
  assert.equal(data.messages.find((m) => m.id === target).reactions.length, 2);
  assert.equal((await react(a, target, '😘')).data.active, false);
  data = await state(a);
  assert.deepEqual(data.messages.find((m) => m.id === target).reactions, [
    { emoji: '❤️', count: 1, mine: false },
  ]);
  assert.equal((await react(c, target, '❤️')).status, 403);
  assert.equal((await react(a, target, 'not-an-emoji')).status, 400);
  assert.equal((await react(a, target, '❤️', { roomId: other })).status, 404);
  const [raw] =
    await sql`select body from tamil_chat.messages where id=${reply.id}`;
  assert.equal((await send(a, raw.body)).status, 400);
  const [event] =
    await sql`select id::text,body from tamil_chat.messages where room_id=${roomId} and body like ${'✨ TamilAI reaction v1 %'} limit 1`;
  assert.equal((await send(a, event.body)).status, 400);
  assert.equal((await react(a, event.id, '❤️')).status, 404);
  const form = new FormData();
  form.set('roomId', roomId);
  form.set('clientId', randomUUID());
  form.set('replyTo', target);
  form.set('caption', 'A photo reply');
  form.set(
    'image',
    new Blob(
      [
        await sharp({
          create: {
            width: 1400,
            height: 900,
            channels: 3,
            background: '#457963',
          },
        })
          .jpeg()
          .toBuffer(),
      ],
      { type: 'image/jpeg' },
    ),
    'photo.jpg',
  );
  const imageResponse = await fetch(base + '/api/chat/images', {
    method: 'POST',
    headers: { Origin: base, Cookie: b.cookie },
    body: form,
  });
  assert.equal(imageResponse.status, 200, await imageResponse.text());
  data = await state(a);
  assert.ok(data.messages.at(-1).has_image);
  assert.equal(data.messages.at(-1).reply.id, target);
  await sql`update tamil_chat.messages set removed_at=now() where id=${target}`;
  data = await state(a);
  assert.equal(
    data.messages.find((m) => m.id === reply.id).reply.preview,
    'Message unavailable',
  );
  assert.equal((await react(a, target, '❤️')).status, 404);
  await sql`update tamil_chat.rooms set status='ended' where id=${roomId}`;
  assert.equal((await react(a, reply.id, '❤️')).status, 403);
  assert.equal((await state(a)).messages.length, 0);
  console.log(
    'PASS: quoted text/photo replies, reply limits, reaction counts/toggle/replacement/idempotency, cross-room and outsider isolation, reserved event replay protection, moderation redaction and ended-chat access.',
  );
} finally {
  for (const id of rooms) {
    await sql`delete from tamil_chat.archives where room_id=${id}`;
    await sql`delete from tamil_chat.limits where key like ${'reaction:' + id + ':%'} or key like ${'seen:' + id + ':%'}`;
  }
  if (users.length) {
    await sql`delete from tamil_chat.sessions where id in ${sql(users)}`;
    for (const id of users)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  await sql.end();
}
