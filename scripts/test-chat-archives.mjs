import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import postgres from 'postgres';
process.loadEnvFile('.env.chat.local');
const base = process.env.CHAT_TEST_URL ?? 'http://localhost:3020';
const sql = postgres(process.env.CHAT_DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});
const digest = (s) => createHash('sha256').update(s).digest('hex');
const ids = [],
  rooms = [];
let moderatorHash;
async function post(user, body) {
  return fetch(base + '/api/chat', {
    method: 'POST',
    headers: {
      Origin: base,
      'Content-Type': 'application/json',
      Cookie: user?.cookie ?? '',
    },
    body: JSON.stringify(body),
  });
}
async function okay(user, body) {
  const response = await post(user, body);
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return data;
}
async function seed(name, notice = true) {
  const id = randomUUID(),
    token = randomBytes(32).toString('base64url');
  ids.push(id);
  await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice) values(${id},${digest(token)},${name},${notice})`;
  return { id, cookie: `tamilai_chat=${token}` };
}
async function archive(room) {
  const response = await fetch(base + `/api/chat/moderation/archives/${room}`, {
    headers: { Cookie: modCookie },
  });
  assert.equal(response.status, 200, await response.clone().text());
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.match(response.headers.get('cache-control'), /no-store/);
  const pdf = Buffer.from(await response.arrayBuffer());
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  const [row] =
    await sql`select snapshot,pdf_data,pdf_sha256,extract(epoch from(expires_at-ended_at))::int as lifetime from tamil_chat.archives where room_id=${room}`;
  assert.equal(row.snapshot, null);
  assert.notEqual(row.pdf_data.subarray(0, 5).toString(), '%PDF-');
  assert.equal(row.pdf_sha256, digest(pdf));
  assert.equal(row.lifetime, 30 * 86400);
  assert.equal(
    (
      await sql`select count(*)::int as n from tamil_chat.archive_access where room_id=${room}`
    )[0].n,
    1,
  );
  return pdf;
}
let modCookie;
try {
  const owner = await seed('Archive Test Host', false),
    guest = await seed('Archive Test Guest'),
    outsider = await seed('Archive Test Other');
  assert.equal((await post(owner, { action: 'create' })).status, 403);
  await okay(owner, { action: 'archive-consent', accepted: true });
  const modToken = randomBytes(32).toString('base64url');
  moderatorHash = digest(modToken);
  modCookie = `tamilai_chat_mod=${modToken}`;
  await sql`insert into tamil_chat.moderators(token_hash,expires_at) values(${moderatorHash},now()+interval '1 hour')`;
  assert.equal(
    (await fetch(base + '/api/chat/moderation/archives')).status,
    401,
  );
  assert.equal((await fetch(base + '/api/chat/maintenance')).status, 401);
  const actions = process.env.CHAT_ARCHIVE_TEST_ACTIONS?.split(',') ?? [
    'end',
    'destroy',
    'block',
    'expiry',
    'leave',
  ];
  assert.ok(
    actions.length &&
      actions.every((action) =>
        ['end', 'destroy', 'block', 'expiry', 'leave'].includes(action),
      ),
  );
  for (const action of actions) {
    const room = await okay(owner, { action: 'create' });
    rooms.push(room.roomId);
    await okay(guest, {
      action: 'accept-invite',
      invite: room.invite,
      roomId: room.roomId,
    });
    await okay(owner, {
      action: 'send',
      roomId: room.roomId,
      clientId: randomUUID(),
      text: 'வணக்கம் நண்பா! Security archive test 👋',
    });
    const form = new FormData();
    form.set('roomId', room.roomId);
    form.set('clientId', randomUUID());
    form.set('caption', 'Reduced image fixture');
    form.set(
      'image',
      new Blob([await readFile('public/chat-stickers/vivek.jpg')], {
        type: 'image/jpeg',
      }),
      'test.jpg',
    );
    const uploaded = await fetch(base + '/api/chat/images', {
      method: 'POST',
      headers: { Origin: base, Cookie: owner.cookie },
      body: form,
    });
    assert.equal(uploaded.status, 200, await uploaded.clone().text());
    const imageId = (await uploaded.json()).messageId;
    if (action === 'expiry') {
      await sql`update tamil_chat.rooms set expires_at=now()-interval '1 second' where id=${room.roomId}`;
      await sql`select tamil_chat.archive_retention()`;
    } else if (action === 'leave') await okay(guest, { action: 'leave' });
    else await okay(owner, { action, roomId: room.roomId });
    assert.equal(
      (
        await fetch(base + `/api/chat/images/${imageId}`, {
          headers: { Cookie: owner.cookie },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await fetch(base + `/api/chat/moderation/archives/${room.roomId}`, {
          headers: { Cookie: outsider.cookie },
        })
      ).status,
      401,
    );
    const pdf = await archive(room.roomId);
    if (action === 'end') {
      await mkdir('tmp/pdfs', { recursive: true });
      await writeFile('tmp/pdfs/chat-archive-integration.pdf', pdf);
    }
    assert.equal(
      (
        await sql`select image_data from tamil_chat.messages where id=${imageId}`
      )[0]?.image_data ?? null,
      null,
    );
    if (action === 'block')
      await sql`delete from tamil_chat.blocks where blocker_id=${owner.id} and blocked_id=${guest.id}`;
    console.log(
      action +
        ': private PDF, image clearing, encryption and retention verified',
    );
  }
  const roomId = rooms[0];
  await sql`update tamil_chat.archives set ended_at=now()-interval '31 days',expires_at=now()-interval '1 day' where room_id=${roomId}`;
  assert.equal(
    (
      await fetch(base + `/api/chat/moderation/archives/${roomId}`, {
        headers: { Cookie: modCookie },
      })
    ).status,
    404,
  );
  await sql`select tamil_chat.archive_retention()`;
  assert.equal(
    (await sql`select 1 from tamil_chat.archives where room_id=${roomId}`)
      .length,
    0,
  );
  const legacyId = randomUUID();
  rooms.push(legacyId);
  await sql`insert into tamil_chat.rooms(id,host_id,source,status) values(${legacyId},${owner.id},'link','pending')`;
  await sql`update tamil_chat.rooms set status='ended' where id=${legacyId}`;
  assert.equal(
    (await sql`select 1 from tamil_chat.archives where room_id=${legacyId}`)
      .length,
    0,
  );
  console.log(
    'PASS: expired archives denied and purged; pre-notice rooms are not archived.',
  );
} finally {
  if (ids.length) {
    await sql`delete from tamil_chat.sessions where id in ${sql(ids)}`;
    await sql`delete from tamil_chat.limits where key like any(${ids.map((id) => '%' + id + '%')})`;
  }
  if (rooms.length)
    await sql`delete from tamil_chat.archives where room_id in ${sql(rooms)}`;
  if (moderatorHash)
    await sql`delete from tamil_chat.moderators where token_hash=${moderatorHash}`;
  await sql.end();
}
