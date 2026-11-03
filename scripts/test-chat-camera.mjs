import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import postgres from 'postgres';
import sharp from 'sharp';
process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3026',
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
const width = 128,
  height = 96,
  raw = Buffer.alloc(width * height * 20 * 3);
for (let frame = 0; frame < 20; frame++)
  raw.fill(
    frame * 11,
    frame * width * height * 3,
    (frame + 1) * width * height * 3,
  );
const sprite = await sharp(raw, {
  raw: { width, height: height * 20, channels: 3 },
})
  .webp()
  .toBuffer();
async function upload(user, room, motion = 'camera-gif-v1', bytes = sprite) {
  const form = new FormData();
  form.set('image', new Blob([bytes], { type: 'image/webp' }), 'camera.webp');
  form.set('roomId', room);
  form.set('clientId', randomUUID());
  form.set('motion', motion);
  const response = await fetch(base + '/api/chat/images', {
    method: 'POST',
    headers: { Origin: base, Cookie: user.cookie },
    body: form,
  });
  return { status: response.status, data: await response.json() };
}
try {
  const a = await guest('CameraTestA'),
    b = await guest('CameraTestB'),
    c = await guest('CameraOther'),
    room = randomUUID();
  rooms.push(room);
  await sql`insert into tamil_chat.rooms(id,host_id,guest_id,source,status) values(${room},${a.id},${b.id},'link','active')`;
  assert.equal((await upload(c, room)).status, 403);
  assert.equal((await upload(a, room, 'invalid-motion')).status, 400);
  assert.equal(
    (
      await upload(
        a,
        room,
        'camera-gif-v1',
        await sharp({
          create: { width: 100, height: 100, channels: 3, background: '#aaa' },
        })
          .webp()
          .toBuffer(),
      )
    ).status,
    400,
  );
  const result = await upload(a, room);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  const id = result.data.messageId;
  const response = await fetch(`${base}/api/chat/images/${id}`, {
    headers: { Cookie: b.cookie },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/gif');
  assert.ok(response.headers.get('cache-control').includes('no-store'));
  const bytes = Buffer.from(await response.arrayBuffer()),
    metadata = await sharp(bytes, { animated: true }).metadata();
  assert.equal(bytes.subarray(0, 3).toString(), 'GIF');
  assert.equal(metadata.pages, 20);
  assert.equal(
    metadata.delay.reduce((sum, n) => sum + n, 0),
    5000,
  );
  assert.ok(bytes.length <= 1048576);
  assert.equal(
    (
      await fetch(`${base}/api/chat/images/${id}`, {
        headers: { Cookie: c.cookie },
      })
    ).status,
    404,
  );
  const [stored] =
    await sql`select octet_length(image_data)::int as bytes,image_type from tamil_chat.messages where id=${id}`;
  assert.equal(stored.image_type, 'image/webp');
  assert.ok(stored.bytes <= 524288);
  await sql`update tamil_chat.rooms set status='ended' where id=${room}`;
  assert.equal(
    (
      await fetch(`${base}/api/chat/images/${id}`, {
        headers: { Cookie: b.cookie },
      })
    ).status,
    404,
  );
  console.log(
    `PASS: 5-second GIF upload/delivery, correct media type, private headers, bounded storage, invalid captures, outsider isolation and ended-chat denial. GIF ${bytes.length} bytes.`,
  );
} finally {
  for (const room of rooms) {
    await sql`delete from tamil_chat.archives where room_id=${room}`;
    await sql`delete from tamil_chat.limits where key like ${`camera:${room}:%`}`;
  }
  if (users.length) {
    await sql`delete from tamil_chat.sessions where id in ${sql(users)}`;
    for (const id of users)
      await sql`delete from tamil_chat.limits where key like ${'%:' + id}`;
  }
  await sql.end();
}
