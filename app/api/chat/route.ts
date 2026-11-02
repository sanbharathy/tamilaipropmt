import { randomUUID } from 'node:crypto';
import {
  assertOrigin,
  bodyOf,
  chatDb,
  ChatError,
  cleanup,
  fail,
  hash,
  limit,
  networkKey,
  respond,
  sessionCookie,
  sessionOf,
  textOf,
  token,
  validId,
} from '@/lib/chat-server';
import { chatTopics } from '@/lib/chat-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const sql = chatDb();
    const me = await sessionOf(request, false);
    if (!me)
      return respond({
        me: null,
        rooms: [],
        people: [],
        messages: [],
        room: null,
      });
    await limit(`poll:${me.id}`, 90, 60);
    await cleanup();
    await sql`update tamil_chat.sessions set last_seen=now() where id=${me.id}`;
    const roomId = new URL(request.url).searchParams.get('room');
    if (roomId) validId(roomId);
    const rooms =
      await sql`select r.id,r.host_id,r.guest_id,r.source,r.status,r.created_at,r.expires_at,
      case when r.host_id=${me.id} then g.name else h.name end as peer_name,
      case when r.host_id=${me.id} then r.guest_id else r.host_id end as peer_id
      from tamil_chat.rooms r join tamil_chat.sessions h on h.id=r.host_id left join tamil_chat.sessions g on g.id=r.guest_id
      where (r.host_id=${me.id} or r.guest_id=${me.id}) and r.expires_at>now() and (${roomId}::uuid is null or r.id=${roomId}::uuid) order by r.created_at desc limit 30`;
    const room = roomId ? (rooms.find((r) => r.id === roomId) ?? null) : null;
    if (roomId && !room)
      throw new ChatError('Conversation not found or expired.', 404);
    const messages =
      room?.status === 'active'
        ? await sql`select id::text,sender_id,body,created_at,has_image from (select id,sender_id,body,created_at,image_type is not null as has_image from tamil_chat.messages where room_id=${room.id} order by id desc limit 100) m order by id`
        : [];
    const people = me.available
      ? await sql`select s.id,s.name,s.topic from tamil_chat.sessions s where s.available=true and s.suspended=false
      and s.id<>${me.id} and s.topic=${me.topic} and s.last_seen>now()-interval '50 seconds' and s.expires_at>now()
      and not exists(select 1 from tamil_chat.blocks b where (b.blocker_id=${me.id} and b.blocked_id=s.id) or (b.blocker_id=s.id and b.blocked_id=${me.id}))
      order by s.last_seen desc limit 20`
      : [];
    return respond({
      me: {
        id: me.id,
        name: me.name,
        available: me.available,
        topic: me.topic,
      },
      rooms,
      room,
      messages,
      people,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await bodyOf(request);
    const sql = chatDb();
    if (body.action === 'resolve-invite') {
      await limit(`resolve:${networkKey(request)}`, 30, 60);
      if (
        typeof body.invite !== 'string' ||
        !/^[a-zA-Z0-9_-]{43}$/.test(body.invite)
      )
        throw new ChatError('Invalid invitation.');
      const [invited] =
        await sql`select id from tamil_chat.rooms where invite_hash=${hash(body.invite)} and status='pending' and expires_at>now()`;
      if (!invited)
        throw new ChatError('This invitation is no longer available.', 404);
      return respond({ roomId: invited.id });
    }
    if (body.action === 'join') {
      const existing = await sessionOf(request, false);
      if (existing) return respond({ ok: true });
      await limit(`join:${networkKey(request)}`, 8, 3600);
      const name = textOf(body.name, 2, 24);
      if (
        !/^[\p{L}\p{M}\p{N} ._-]+$/u.test(name) ||
        /admin|moderator|support|நிர்வாகி/i.test(name)
      )
        throw new ChatError(
          'Choose a nickname with letters or numbers. Staff names are reserved.',
        );
      if (body.accepted !== true)
        throw new ChatError('Please accept the chat rules first.');
      const secret = token();
      await sql`insert into tamil_chat.sessions(id,token_hash,name) values(${randomUUID()},${hash(secret)},${name})`;
      const response = respond({ ok: true });
      response.cookies.set(sessionCookie, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/chat',
        maxAge: 86400,
      });
      return response;
    }
    const me = await sessionOf(request);
    await limit(`actions:${me.id}`, 60, 60);
    await cleanup();

    if (body.action === 'availability') {
      if (
        typeof body.available !== 'boolean' ||
        !chatTopics.some((t) => t.id === body.topic)
      )
        throw new ChatError('Invalid availability setting.');
      await sql`update tamil_chat.sessions set available=${body.available},topic=${String(body.topic)},last_seen=now() where id=${me.id}`;
      return respond({ ok: true });
    }
    if (body.action === 'leave') {
      await sql.begin(async (tx) => {
        await tx`update tamil_chat.sessions set available=false,expires_at=now() where id=${me.id}`;
        await tx`update tamil_chat.rooms set status='ended' where host_id=${me.id} or guest_id=${me.id}`;
      });
      const response = respond({ ok: true });
      response.cookies.set(sessionCookie, '', { path: '/api/chat', maxAge: 0 });
      return response;
    }
    if (body.action === 'create' || body.action === 'request') {
      await limit(`rooms:${me.id}`, 10, 3600);
      await limit(`room-network:${networkKey(request)}`, 30, 3600);
      const invite = body.action === 'create' ? token() : null;
      const peer = body.action === 'request' ? validId(body.peer) : null;
      const room = await sql.begin(async (tx) => {
        if (peer) {
          if (!me.available || peer === me.id)
            throw new ChatError('Enable availability to request a chat.');
          const [target] =
            await tx`select id from tamil_chat.sessions where id=${peer} and available=true and topic=${me.topic} and suspended=false and last_seen>now()-interval '50 seconds' and expires_at>now() for update`;
          if (!target)
            throw new ChatError('This person is no longer available.');
          const blocks =
            await tx`select 1 from tamil_chat.blocks where (blocker_id=${me.id} and blocked_id=${peer}) or (blocker_id=${peer} and blocked_id=${me.id})`;
          if (blocks.length)
            throw new ChatError('This conversation is not available.', 403);
          const [pending] =
            await tx`select id from tamil_chat.rooms where ((host_id=${me.id} and guest_id=${peer}) or (host_id=${peer} and guest_id=${me.id})) and status in ('pending','active') and expires_at>now()`;
          if (pending) return pending;
        }
        const [created] =
          await tx`insert into tamil_chat.rooms(id,host_id,guest_id,invite_hash,source) values(${randomUUID()},${me.id},${peer},${invite ? hash(invite) : null},${peer ? 'directory' : 'link'}) returning id`;
        return created;
      });
      return respond({ roomId: room.id, invite });
    }
    if (body.action === 'preview' || body.action === 'accept-invite') {
      await limit(`invite:${me.id}`, 20, 60);
      if (
        typeof body.invite !== 'string' ||
        !/^[a-zA-Z0-9_-]{43}$/.test(body.invite)
      )
        throw new ChatError('Invalid invitation link.');
      const result = await sql.begin(async (tx) => {
        const [room] =
          await tx`select r.*,s.name as host_name from tamil_chat.rooms r join tamil_chat.sessions s on s.id=r.host_id where r.invite_hash=${hash(String(body.invite))} and r.source='link' and r.expires_at>now() and s.expires_at>now() and s.suspended=false for update of r`;
        if (!room || room.status === 'ended' || room.status === 'declined')
          throw new ChatError('This invitation has expired or ended.', 404);
        if (body.roomId && body.roomId !== room.id)
          throw new ChatError(
            'This invitation belongs to a different conversation.',
            400,
          );
        if (room.host_id === me.id || room.guest_id === me.id)
          return { roomId: room.id, hostName: room.host_name, own: true };
        if (room.guest_id)
          throw new ChatError('This conversation already has two people.', 409);
        const blocked =
          await tx`select 1 from tamil_chat.blocks where (blocker_id=${me.id} and blocked_id=${room.host_id}) or (blocker_id=${room.host_id} and blocked_id=${me.id})`;
        if (blocked.length)
          throw new ChatError('This conversation is not available.', 403);
        if (body.action === 'accept-invite')
          await tx`update tamil_chat.rooms set guest_id=${me.id},status='active',invite_hash=null where id=${room.id}`;
        return { roomId: room.id, hostName: room.host_name, own: false };
      });
      return respond(result);
    }
    const roomId = validId(body.roomId);
    const [room] =
      await sql`select * from tamil_chat.rooms where id=${roomId} and (host_id=${me.id} or guest_id=${me.id}) and expires_at>now()`;
    if (!room) throw new ChatError('Conversation not found or expired.', 404);
    const peer = room.host_id === me.id ? room.guest_id : room.host_id;
    if (body.action === 'accept' || body.action === 'decline') {
      if (
        room.guest_id !== me.id ||
        room.status !== 'pending' ||
        room.source !== 'directory'
      )
        throw new ChatError('Only the invited person can respond.', 403);
      await sql`update tamil_chat.rooms set status=${body.action === 'accept' ? 'active' : 'declined'} where id=${roomId} and status='pending'`;
      return respond({ ok: true });
    }
    if (body.action === 'end' || body.action === 'block') {
      await sql.begin(async (tx) => {
        await tx`select id from tamil_chat.rooms where id=${roomId} for update`;
        await tx`update tamil_chat.rooms set status='ended',invite_hash=null where id=${roomId}`;
        if (body.action === 'block' && peer) {
          await tx`insert into tamil_chat.blocks(blocker_id,blocked_id) values(${me.id},${peer}) on conflict do nothing`;
          await tx`update tamil_chat.rooms set status='ended',invite_hash=null where (host_id=${me.id} and guest_id=${peer}) or (host_id=${peer} and guest_id=${me.id})`;
        }
      });
      return respond({ ok: true });
    }
    if (body.action === 'report') {
      await limit(`reports:${me.id}`, 5, 3600);
      const reason = textOf(body.reason, 3, 300);
      if (
        typeof body.messageId !== 'string' ||
        !/^\d{1,20}$/.test(body.messageId)
      )
        throw new ChatError('Choose the message to report.');
      const [message] =
        await sql`select id,sender_id,body from tamil_chat.messages where id=${body.messageId} and room_id=${roomId} and sender_id<>${me.id}`;
      if (!message) throw new ChatError('Message not found.', 404);
      await sql`insert into tamil_chat.reports(id,reporter_id,reported_id,message_id,excerpt,reason) values(${randomUUID()},${me.id},${message.sender_id},${message.id},${message.body},${reason})`;
      return respond({ ok: true });
    }
    if (body.action === 'send') {
      const message = textOf(body.text, 1, 1200);
      const clientId = validId(body.clientId);
      await limit(`messages:${me.id}`, 15, 60);
      await limit(`message-network:${networkKey(request)}`, 120, 300);
      await sql.begin(async (tx) => {
        const [current] =
          await tx`select status,host_id,guest_id from tamil_chat.rooms where id=${roomId} for update`;
        if (current?.status !== 'active' || !current.guest_id)
          throw new ChatError('Both people must accept before chatting.');
        const blocked =
          await tx`select 1 from tamil_chat.blocks where (blocker_id=${current.host_id} and blocked_id=${current.guest_id}) or (blocker_id=${current.guest_id} and blocked_id=${current.host_id})`;
        if (blocked.length)
          throw new ChatError('This conversation is blocked.', 403);
        await tx`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${roomId},${me.id},${clientId},${message}) on conflict(sender_id,client_id) do nothing`;
      });
      return respond({ ok: true });
    }
    throw new ChatError('Unknown chat action.');
  } catch (error) {
    return fail(error);
  }
}
