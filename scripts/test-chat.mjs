import assert from 'node:assert/strict';
import { randomUUID, createHmac } from 'node:crypto';
import postgres from 'postgres';

process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020';
const network = `chat-test-${randomUUID()}`;
const people = [];
const fixtureRooms = new Set();
const sql = postgres(process.env.CHAT_DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
async function call(person, body, path = '/api/chat') {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      origin: base,
      'Content-Type': 'application/json',
      'x-vercel-forwarded-for': network,
      ...(person.cookie ? { cookie: person.cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const cookie = response.headers.get('set-cookie');
  if (cookie) person.cookie = cookie.split(';')[0];
  return { status: response.status, data: await response.json() };
}
async function guest(name) {
  const person = {};
  assert.equal(
    (
      await call(person, {
        action: 'join',
        name,
        accepted: true,
        archiveConsent: true,
      })
    ).status,
    200,
  );
  const state = await call(person);
  person.id = state.data.me.id;
  people.push(person);
  return person;
}
async function ok(person, body, path) {
  const result = await call(person, body, path);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  if (result.data.roomId) fixtureRooms.add(result.data.roomId);
  return result.data;
}
try {
  const a = await guest('TestCreatorA');
  const b = await guest('TestCreatorB');
  const c = await guest('TestCreatorC');
  const room = await ok(a, { action: 'create' });
  assert.equal(
    (await call(a, { action: 'request', peer: c.id })).status,
    400,
    'Directory requests require opt-in',
  );
  assert.equal(
    (
      await call(a, {
        action: 'send',
        roomId: room.roomId,
        text: 'before consent',
        clientId: randomUUID(),
      })
    ).status,
    400,
  );
  await ok(b, { action: 'preview', invite: room.invite });
  assert.equal(
    (await call(a, undefined, `/api/chat?room=${room.roomId}`)).data.room
      .status,
    'pending',
  );
  assert.equal(
    (await call(c, undefined, `/api/chat?room=${room.roomId}`)).status,
    404,
  );
  await ok(b, { action: 'accept-invite', invite: room.invite });
  assert.equal(
    (await call(c, { action: 'accept-invite', invite: room.invite })).status,
    404,
  );
  const clientId = randomUUID();
  await ok(a, {
    action: 'send',
    roomId: room.roomId,
    text: 'வணக்கம்! Let’s share a prompt.',
    clientId,
  });
  await ok(a, {
    action: 'send',
    roomId: room.roomId,
    text: 'வணக்கம்! Let’s share a prompt.',
    clientId,
  });
  await ok(b, {
    action: 'send',
    roomId: room.roomId,
    text: 'Hello! Both devices are connected.',
    clientId: randomUUID(),
  });
  const state = await ok(b, undefined, `/api/chat?room=${room.roomId}`);
  assert.equal(state.messages.length, 2, 'Retries must not duplicate messages');
  assert.equal(
    (
      await call(c, {
        action: 'send',
        roomId: room.roomId,
        text: 'intrusion',
        clientId: randomUUID(),
      })
    ).status,
    404,
  );
  const badOrigin = await fetch(base + '/api/chat', {
    method: 'POST',
    headers: {
      origin: 'https://unrelated.invalid',
      'Content-Type': 'application/json',
      cookie: a.cookie,
    },
    body: JSON.stringify({
      action: 'availability',
      available: true,
      topic: 'ai',
    }),
  });
  assert.equal(badOrigin.status, 403);
  await ok(a, { action: 'availability', available: true, topic: 'ai' });
  assert.equal(
    (await ok(a)).people.length,
    0,
    'People who did not opt in must stay hidden',
  );
  await ok(c, { action: 'availability', available: true, topic: 'ai' });
  assert.ok((await ok(a)).people.some((person) => person.id === c.id));
  const request = await ok(a, { action: 'request', peer: c.id });
  assert.equal(
    (await call(a, { action: 'accept', roomId: request.roomId })).status,
    403,
  );
  assert.ok(
    (await ok(c)).rooms.some(
      (r) => r.id === request.roomId && r.status === 'pending',
    ),
  );
  await ok(c, { action: 'decline', roomId: request.roomId });
  assert.equal(
    (
      await call(a, {
        action: 'send',
        roomId: request.roomId,
        text: 'declined',
        clientId: randomUUID(),
      })
    ).status,
    400,
  );
  await ok(c, { action: 'block', roomId: request.roomId });
  assert.equal((await call(a, { action: 'request', peer: c.id })).status, 403);
  await ok(b, {
    action: 'report',
    roomId: room.roomId,
    messageId: state.messages[0].id,
    reason: 'Integration test report',
  });
  const mod = {};
  assert.equal(
    (await call(mod, undefined, '/api/chat/moderation')).status,
    401,
  );
  await ok(
    mod,
    { action: 'login', key: process.env.CHAT_MODERATOR_KEY },
    '/api/chat/moderation',
  );
  const moderation = await ok(mod, undefined, '/api/chat/moderation');
  const report = moderation.reports.find(
    (r) => r.reason === 'Integration test report',
  );
  assert.ok(report);
  await ok(
    mod,
    { action: 'remove-message', reportId: report.id },
    '/api/chat/moderation',
  );
  assert.equal(
    (await ok(b, undefined, `/api/chat?room=${room.roomId}`)).messages.length,
    1,
  );
  const raceRoom = await ok(a, { action: 'create' });
  const race = await Promise.all([
    call(b, { action: 'accept-invite', invite: raceRoom.invite }),
    call(c, { action: 'accept-invite', invite: raceRoom.invite }),
  ]);
  assert.equal(
    race.filter((r) => r.status === 200).length,
    1,
    'Exactly one visitor can claim the second seat',
  );
  assert.ok(race.some((r) => [403, 404, 409].includes(r.status)));
  await ok(b, { action: 'end', roomId: room.roomId });
  assert.equal(
    (
      await call(a, {
        action: 'send',
        roomId: room.roomId,
        text: 'after end',
        clientId: randomUUID(),
      })
    ).status,
    400,
  );
  const d = await guest('TestCreatorD');
  const limitedRoom = await ok(d, { action: 'create' });
  await ok(c, { action: 'accept-invite', invite: limitedRoom.invite });
  assert.equal(
    (
      await call(d, {
        action: 'send',
        roomId: limitedRoom.roomId,
        text: 'x'.repeat(1201),
        clientId: randomUUID(),
      })
    ).status,
    400,
  );
  for (let i = 0; i < 15; i++)
    await ok(d, {
      action: 'send',
      roomId: limitedRoom.roomId,
      text: `Rate-limit test ${i}`,
      clientId: randomUUID(),
    });
  assert.equal(
    (
      await call(d, {
        action: 'send',
        roomId: limitedRoom.roomId,
        text: 'Too fast',
        clientId: randomUUID(),
      })
    ).status,
    429,
  );
  await ok(
    mod,
    { action: 'suspend', reportId: report.id },
    '/api/chat/moderation',
  );
  assert.equal(
    (await call(a)).status,
    403,
    'Moderator suspension must disable guest access',
  );
  await ok(mod, { action: 'logout' }, '/api/chat/moderation');
  await ok(c, { action: 'leave' });
  assert.equal((await ok(c)).me, null);
  console.log(
    'PASS: consent gates, two-way Tamil/English messaging, deduplication, outsider isolation, origin protection, opt-in discovery, decline, block, report, moderator access, message removal, suspension, concurrent invite claims, message length, spam limits, end and logout.',
  );
} finally {
  const ids = people.map((person) => person.id);
  if (ids.length) {
    await sql`delete from tamil_chat.reports where reporter_id in ${sql(ids)}`;
    await sql`delete from tamil_chat.sessions where id in ${sql(ids)}`;
    if (fixtureRooms.size)
      await sql`delete from tamil_chat.archives where room_id in ${sql([...fixtureRooms])}`;
    for (const id of ids)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  const digest = createHmac('sha256', process.env.CHAT_RATE_SALT)
    .update(network)
    .digest('hex');
  await sql`delete from tamil_chat.limits where key like ${'%:' + digest}`;
  await sql.end();
}
