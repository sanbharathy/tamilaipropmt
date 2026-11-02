import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import postgres from 'postgres';
process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020';
const sql = postgres(process.env.CHAT_DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
const users = [],
  rooms = [];
async function guest(name) {
  const id = randomUUID(),
    secret = randomBytes(32).toString('base64url');
  users.push(id);
  await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice) values(${id},${createHash('sha256').update(secret).digest('hex')},${name},true)`;
  return { id, cookie: `tamilai_chat=${secret}` };
}
async function room(a, b) {
  const id = randomUUID();
  rooms.push(id);
  await sql`insert into tamil_chat.rooms(id,host_id,guest_id,source,status) values(${id},${a.id},${b.id},'link','active')`;
  return id;
}
async function get(user, roomId, screen, sequence = 1, read) {
  const response = await fetch(
    `${base}/api/chat?room=${roomId}${screen ? `&screen=${screen}&sequence=${sequence}` : ''}${read ? `&read=${read}` : ''}`,
    { headers: { Cookie: user.cookie } },
  );
  const data = await response.json();
  return { status: response.status, ...data };
}
async function hide(user, roomId, screen, sequence) {
  return fetch(base + '/api/chat/presence', {
    method: 'POST',
    headers: {
      Origin: base,
      'Content-Type': 'application/json',
      Cookie: user.cookie,
    },
    body: JSON.stringify({ roomId, screen, sequence, present: false }),
  });
}
try {
  const a = await guest('Presence Test A'),
    b = await guest('Presence Test B'),
    c = await guest('Presence Test Other');
  const id = await room(a, b),
    other = await room(a, c),
    screen = randomUUID(),
    secondScreen = randomUUID();
  assert.equal((await get(b, id)).room.peer_viewing, false);
  assert.equal((await get(b, id)).room.peer_last_seen, null);
  assert.equal((await get(a, id, screen)).status, 200);
  let state = await get(b, id);
  assert.equal(state.room.peer_viewing, true);
  assert.ok(state.room.peer_last_seen);
  assert.ok(state.room.peer_active_until);
  const [first] =
    await sql`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${id},${a.id},${randomUUID()},'First receipt fixture') returning id::text`;
  const [unseen] =
    await sql`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${id},${a.id},${randomUUID()},'Unseen earlier fixture') returning id::text`;
  const [second] =
    await sql`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${id},${a.id},${randomUUID()},'Second receipt fixture') returning id::text`;
  const [differentRoom] =
    await sql`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${other},${a.id},${randomUUID()},'Other room fixture') returning id::text`;
  const readerScreen = randomUUID();
  await get(b, id, undefined, 1, second.id);
  assert.equal(
    (await get(a, id)).room.peer_read_id,
    '0',
    'Background poll must not mark messages seen',
  );
  await get(b, id, readerScreen, 1, first.id);
  assert.equal((await get(a, id)).room.peer_read_id, first.id);
  await get(b, id, readerScreen, 2, second.id);
  assert.equal((await get(a, id)).room.peer_read_id, second.id);
  const receiptState = (await get(a, id)).messages;
  assert.equal(
    receiptState.find((message) => message.id === first.id).seen,
    true,
  );
  assert.equal(
    receiptState.find((message) => message.id === second.id).seen,
    true,
  );
  assert.equal(
    receiptState.find((message) => message.id === unseen.id).seen,
    false,
    'An earlier unobserved message must remain unseen',
  );
  await get(b, id, readerScreen, 3, first.id);
  assert.equal(
    (await get(a, id)).room.peer_read_id,
    second.id,
    'Receipts cannot move backwards',
  );
  await get(b, id, readerScreen, 4, differentRoom.id);
  assert.equal(
    (await get(a, id)).room.peer_read_id,
    second.id,
    'Other-room messages cannot update receipts',
  );
  console.log(
    'PASS: seen receipts require a screen heartbeat, validate incoming messages in the room and remain monotonic.',
  );
  assert.equal((await get(c, id)).status, 404);
  assert.equal((await hide(c, id, screen, 2)).status, 404);
  assert.equal((await get(c, other)).room.peer_last_seen, null);
  assert.equal((await hide(a, id, screen, 2)).status, 200);
  state = await get(b, id);
  assert.equal(state.room.peer_viewing, false);
  assert.ok(state.room.peer_last_seen);
  // A late older heartbeat must not undo a newer hide event.
  await get(a, id, screen, 1);
  assert.equal((await get(b, id)).room.peer_viewing, false);
  await get(a, id, screen, 3);
  await get(a, id, secondScreen, 1);
  await hide(a, id, screen, 4);
  assert.equal((await get(b, id)).room.peer_viewing, true);
  await hide(a, id, secondScreen, 2);
  assert.equal((await get(b, id)).room.peer_viewing, false);
  // Abrupt disconnect: no hide event, but the heartbeat times out.
  await get(a, id, screen, 5);
  await sql`update tamil_chat.room_presence set last_seen=now()-interval '21 seconds' where room_id=${id} and session_id=${a.id}`;
  state = await get(b, id);
  assert.equal(state.room.peer_viewing, false);
  assert.ok(state.room.peer_last_seen);
  assert.equal((await get(a, id, 'invalid', 6)).status, 400);
  await sql`update tamil_chat.rooms set status='ended' where id=${id}`;
  assert.equal((await get(b, id)).room.peer_last_seen, undefined);
  assert.equal((await hide(a, id, screen, 6)).status, 404);
  await sql`update tamil_chat.rooms set expires_at=now()-interval '1 second' where id=${id}`;
  await sql`select tamil_chat.archive_retention()`;
  assert.equal(
    (await sql`select 1 from tamil_chat.room_presence where room_id=${id}`)
      .length,
    0,
  );
  console.log(
    'PASS: room-only presence, visible/hidden transitions, multi-tab status, out-of-order requests, disconnect timeout, outsider isolation and expiry cleanup.',
  );
} finally {
  if (users.length) {
    await sql`delete from tamil_chat.sessions where id in ${sql(users)}`;
    for (const id of users)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  if (rooms.length) {
    await sql`delete from tamil_chat.archives where room_id in ${sql(rooms)}`;
    for (const id of rooms)
      await sql`delete from tamil_chat.limits where key like ${'seen:' + id + ':%'}`;
  }
  await sql.end();
}
