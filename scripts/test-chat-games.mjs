import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import postgres from 'postgres';
process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020',
  sql = postgres(process.env.CHAT_DATABASE_URL, {
    ssl: 'require',
    max: 1,
    prepare: false,
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
let current, roomId;
async function action(user, action, extra = {}) {
  return call(user, '/api/chat/games', {
    roomId,
    action,
    gameId: current?.id,
    expectedRevision: current?.revision,
    clientId: randomUUID(),
    ...extra,
  });
}
async function okay(user, act, extra = {}) {
  const response = await action(user, act, extra);
  assert.equal(response.status, 200, JSON.stringify(response.data));
  current = response.data.game;
  return response;
}
try {
  const a = await guest('GameTestA'),
    b = await guest('GameTestB'),
    c = await guest('GameTestOther');
  roomId = randomUUID();
  rooms.push(roomId);
  await sql`insert into tamil_chat.rooms(id,host_id,guest_id,source,status) values(${roomId},${a.id},${b.id},'link','pending')`;
  assert.equal((await action(a, 'start', { kind: 'tic-tac-toe' })).status, 403);
  await sql`update tamil_chat.rooms set status='active' where id=${roomId}`;
  assert.equal((await action(c, 'start', { kind: 'tic-tac-toe' })).status, 403);
  await okay(a, 'start', { kind: 'tic-tac-toe' });
  assert.equal(current.phase, 'invited');
  assert.equal((await action(a, 'move', { move: 0 })).status, 409);
  assert.equal((await action(a, 'accept')).status, 409);
  await okay(b, 'accept');
  const revision = current.revision,
    id1 = randomUUID(),
    id2 = randomUUID();
  const concurrent = await Promise.all([
    action(a, 'move', { move: 0, clientId: id1 }),
    action(a, 'move', { move: 0, clientId: id2 }),
  ]);
  assert.deepEqual(
    concurrent.map((result) => result.status).sort((a, b) => a - b),
    [200, 409],
  );
  const success = concurrent.findIndex((result) => result.status === 200);
  current = concurrent[success].data.game;
  await okay(a, 'move', {
    move: 0,
    clientId: success === 0 ? id1 : id2,
    expectedRevision: revision,
  });
  assert.equal(current.revision, revision + 1);
  assert.equal(
    (await action(b, 'move', { move: 3, expectedRevision: revision })).status,
    409,
  );
  const chat = await call(a, '/api/chat', {
    action: 'send',
    roomId,
    clientId: randomUUID(),
    text: 'Chat still works while the game is open.',
  });
  assert.equal(chat.status, 200);
  for (const [user, cell] of [
    [b, 3],
    [a, 1],
    [b, 4],
    [a, 2],
  ])
    await okay(user, 'move', { move: cell });
  assert.equal(current.phase, 'finished');
  assert.equal(current.winner, 0);
  const state = await call(b, `/api/chat?room=${roomId}`);
  assert.equal(state.data.game.id, current.id);
  assert.equal(state.data.game.revision, current.revision);
  assert.ok(state.data.messages.some((message) => message.game_event));
  assert.ok(
    state.data.messages.some(
      (message) => message.body === 'Chat still works while the game is open.',
    ),
  );
  const [event] =
    await sql`select body from tamil_chat.messages where room_id=${roomId} order by id desc limit 1`;
  assert.equal(
    (
      await call(a, '/api/chat', {
        action: 'send',
        roomId,
        clientId: randomUUID(),
        text: event.body,
      })
    ).status,
    400,
    'Ordinary messages cannot replay signed game states',
  );
  for (const kind of ['connect-four', 'dots-boxes', 'take-21']) {
    await okay(a, 'start', { kind });
    await okay(b, 'accept');
    await okay(a, 'move', { move: kind === 'take-21' ? 1 : 0 });
    assert.equal(current.kind, kind);
    await okay(b, 'resign');
    assert.equal(current.phase, 'finished');
  }
  await okay(a, 'start', { kind: 'tic-tac-toe' });
  await okay(b, 'decline');
  assert.equal(current.phase, 'declined');
  await okay(a, 'start', { kind: 'take-21' });
  await okay(a, 'resign');
  assert.equal(current.phase, 'declined');
  await sql`update tamil_chat.rooms set status='ended' where id=${roomId}`;
  assert.equal((await action(a, 'start', { kind: 'tic-tac-toe' })).status, 403);
  assert.equal((await call(a, `/api/chat?room=${roomId}`)).data.game, null);
  console.log(
    'PASS: friend consent, all four games, turn enforcement, concurrent moves, idempotency, stale revision rejection, chat alongside play, replay protection, outsider isolation and end-of-chat access.',
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
