import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import postgres from 'postgres';
process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3024',
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
  await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice)values(${id},${createHash('sha256').update(secret).digest('hex')},${name},true)`;
  return { id, cookie: 'tamilai_chat=' + secret };
}
async function get(user, room) {
  const r = await fetch(`${base}/api/chat?room=${room}`, {
    headers: { Cookie: user.cookie },
  });
  return { status: r.status, data: await r.json() };
}
async function typing(user, room, screen, sequence, flag = true) {
  const r = await fetch(base + '/api/chat/presence', {
    method: 'POST',
    headers: {
      Cookie: user.cookie,
      Origin: base,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomId: room, screen, sequence, typing: flag }),
  });
  return { status: r.status, data: await r.json() };
}
try {
  const a = await guest('TypingTestA'),
    b = await guest('TypingTestB'),
    c = await guest('TypingOther'),
    room = randomUUID(),
    screen = randomUUID(),
    second = randomUUID();
  rooms.push(room);
  await sql`insert into tamil_chat.rooms(id,host_id,guest_id,source,status)values(${room},${a.id},${b.id},'link','active')`;
  assert.equal((await typing(a, room, screen, 1)).status, 200);
  assert.ok((await get(b, room)).data.room.peer_typing_until);
  assert.equal((await get(a, room)).data.room.peer_typing_until, null);
  assert.equal((await typing(a, room, screen, 2, false)).status, 200);
  assert.equal((await get(b, room)).data.room.peer_typing_until, null);
  await typing(a, room, screen, 1);
  assert.equal(
    (await get(b, room)).data.room.peer_typing_until,
    null,
    'An older typing event cannot undo a newer stop',
  );
  await typing(a, room, screen, 3);
  await typing(a, room, second, 1);
  await typing(a, room, screen, 4, false);
  assert.ok(
    (await get(b, room)).data.room.peer_typing_until,
    'Other browser tab can still be typing',
  );
  await typing(a, room, second, 2, false);
  assert.equal((await typing(c, room, screen, 5)).status, 404);
  assert.equal((await typing(a, room, 'bad-screen', 5)).status, 400);
  await sql`update tamil_chat.sessions set archive_notice=false where id=${a.id}`;
  assert.equal((await typing(a, room, screen, 5)).status, 403);
  await sql`update tamil_chat.sessions set archive_notice=true where id=${a.id}`;
  await typing(a, room, screen, 6);
  await sql`update tamil_chat.limits set expires_at=now()-interval '1 second' where key like ${`typing:${room}:%`}`;
  assert.equal((await get(b, room)).data.room.peer_typing_until, null);
  await sql`update tamil_chat.rooms set status='ended' where id=${room}`;
  assert.equal((await typing(a, room, screen, 7)).status, 404);
  assert.equal((await get(b, room)).data.room.peer_typing_until, undefined);
  console.log(
    'PASS: temporary typing status, stop/expiry, stale request ordering, multiple tabs, consent, outsider isolation and ended-chat denial.',
  );
} finally {
  for (const room of rooms) {
    await sql`delete from tamil_chat.archives where room_id=${room}`;
    await sql`delete from tamil_chat.limits where key like ${`typing:${room}:%`}`;
  }
  if (users.length) {
    await sql`delete from tamil_chat.sessions where id in ${sql(users)}`;
    for (const id of users)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  await sql.end();
}
