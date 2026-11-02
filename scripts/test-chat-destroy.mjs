import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import postgres from 'postgres';
import sharp from 'sharp';

process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020';
const sql = postgres(process.env.CHAT_DATABASE_URL, {
  ssl: 'require',
  prepare: false,
  max: 1,
});
const people = [];
const fixtureRooms = new Set();
const network = `destroy-test-${randomUUID()}`;
async function guest(name) {
  const id = randomUUID();
  const secret = randomBytes(32).toString('base64url');
  const digest = createHash('sha256').update(secret).digest('hex');
  await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice) values(${id},${digest},${name},true)`;
  const person = { id, cookie: `tamilai_chat=${secret}` };
  people.push(person);
  return person;
}
async function call(person, body) {
  const response = await fetch(base + '/api/chat', {
    method: 'POST',
    headers: {
      origin: base,
      'Content-Type': 'application/json',
      'x-vercel-forwarded-for': network,
      cookie: person.cookie,
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
async function ok(person, body) {
  const result = await call(person, body);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  if (result.data.roomId) fixtureRooms.add(result.data.roomId);
  return result.data;
}
try {
  const owner = await guest('DestroyTestOwner');
  const friend = await guest('DestroyTestFriend');
  const outsider = await guest('DestroyTestOther');
  const pending = await ok(owner, { action: 'create' });
  assert.equal(
    (await call(outsider, { action: 'destroy', roomId: pending.roomId }))
      .status,
    404,
  );
  await ok(owner, { action: 'destroy', roomId: pending.roomId });
  assert.equal(
    (await call(friend, { action: 'resolve-invite', invite: pending.invite }))
      .status,
    404,
  );
  assert.equal(
    (await call(friend, { action: 'accept-invite', invite: pending.invite }))
      .status,
    404,
  );
  await ok(owner, { action: 'destroy', roomId: pending.roomId });
  const active = await ok(owner, { action: 'create' });
  await ok(friend, { action: 'accept-invite', invite: active.invite });
  assert.equal(
    (await call(friend, { action: 'destroy', roomId: active.roomId })).status,
    403,
    'Only the creator may destroy a chat',
  );
  const image = await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#304f40' },
  })
    .webp()
    .toBuffer();
  const [message] =
    await sql`insert into tamil_chat.messages(room_id,sender_id,client_id,body,image_data,image_type) values(${active.roomId},${owner.id},${randomUUID()},'Destroy test attachment',${image},'image/webp') returning id`;
  await ok(owner, { action: 'destroy', roomId: active.roomId });
  const [closed] =
    await sql`select status,invite_hash from tamil_chat.rooms where id=${active.roomId}`;
  assert.equal(closed.status, 'ended');
  assert.equal(closed.invite_hash, null);
  const [cleared] =
    await sql`select image_data,image_type from tamil_chat.messages where id=${message.id}`;
  assert.equal(cleared.image_data, null);
  assert.equal(cleared.image_type, null);
  assert.equal(
    (
      await call(friend, {
        action: 'send',
        roomId: active.roomId,
        text: 'After destruction',
        clientId: randomUUID(),
      })
    ).status,
    400,
  );
  const race = await ok(owner, { action: 'create' });
  const results = await Promise.all([
    call(owner, { action: 'destroy', roomId: race.roomId }),
    call(friend, { action: 'accept-invite', invite: race.invite }),
  ]);
  assert.equal(results[0].status, 200);
  assert.ok([200, 404].includes(results[1].status));
  const [final] =
    await sql`select status,invite_hash from tamil_chat.rooms where id=${race.roomId}`;
  assert.equal(final.status, 'ended');
  assert.equal(final.invite_hash, null);
  console.log(
    'PASS: creator-only destruction before/after joining, invite revocation, image clearing, blocked sends, idempotency, and concurrent acceptance/destruction.',
  );
} finally {
  const ids = people.map((person) => person.id);
  if (ids.length) {
    await sql`delete from tamil_chat.sessions where id in ${sql(ids)}`;
    if (fixtureRooms.size)
      await sql`delete from tamil_chat.archives where room_id in ${sql([...fixtureRooms])}`;
    for (const id of ids)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  await sql.end();
}
