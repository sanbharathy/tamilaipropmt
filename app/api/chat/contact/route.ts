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
  textOf,
  token,
  validId,
} from '@/lib/chat-server';
import { scheduleArchives } from '@/lib/chat-archives';
import {
  contactCookie,
  ownerCookie,
  contactMarker,
  contactOwner,
  contactIdentity,
  isOwnerKey,
} from '@/lib/chat-contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/chat/contact',
};
const chatOptions = { ...cookieOptions, path: '/api/chat' };

export async function GET(request: Request) {
  try {
    await limit(`contact-poll:${networkKey(request)}`, 100, 60);
    await cleanup();
    scheduleArchives();
    const me = await contactIdentity(request),
      owner = contactOwner(),
      sql = chatDb();
    if (!me) return respond({ me: null, rooms: [] });
    const rooms =
      me.role === 'owner'
        ? await sql`select r.id,r.expires_at,g.name as peer_name,
          (select max(m.created_at) from tamil_chat.messages m where m.room_id=r.id) as last_message_at
          from tamil_chat.rooms r join tamil_chat.sessions g on g.id=r.guest_id
          where r.host_id=${owner.id} and r.status='active' and r.expires_at>now()
          order by coalesce((select max(m.created_at) from tamil_chat.messages m where m.room_id=r.id),r.created_at) desc limit 100`
        : await sql`select id,expires_at,'App owner' as peer_name from tamil_chat.rooms
          where host_id=${owner.id} and guest_id=${me.id} and status='active' and expires_at>now() order by created_at desc limit 1`;
    return respond({ me: { role: me.role, name: me.name }, rooms });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await bodyOf(request),
      owner = contactOwner(),
      sql = chatDb();
    await limit(`contact-action:${networkKey(request)}`, 40, 60);
    await cleanup();
    scheduleArchives();
    if (body.action === 'owner-login') {
      await limit(`contact-login:${networkKey(request)}`, 5, 900);
      if (!isOwnerKey(body.key, owner.key))
        throw new ChatError('Incorrect owner key.', 401);
      if (body.accepted !== true)
        throw new ChatError('Acknowledge the archive notice first.');
      const secret = token();
      await sql.begin(async (tx) => {
        const [person] =
          await tx`insert into tamil_chat.sessions(id,token_hash,name,topic,archive_notice,expires_at)
          values(${owner.id},${hash(secret)},'App owner','taie-contact-owner',true,now()+interval '100 years')
          on conflict(id) do update set token_hash=excluded.token_hash,topic=excluded.topic,expires_at=excluded.expires_at
          where not tamil_chat.sessions.suspended returning id`;
        if (!person) throw new ChatError('Owner access is suspended.', 403);
        await tx`insert into tamil_chat.limits(key,count,expires_at)
          values(${`taie-owner:${owner.id}:${hash(secret)}`},1,now()+interval '7 days')`;
      });
      const response = respond({ ok: true });
      response.cookies.set(ownerCookie, secret, {
        ...cookieOptions,
        maxAge: 604800,
      });
      response.cookies.set(sessionCookie, secret, {
        ...chatOptions,
        maxAge: 604800,
      });
      return response;
    }
    if (body.action === 'owner-logout') {
      const response = respond({ ok: true });
      const secret = request.headers
        .get('cookie')
        ?.split(';')
        .map((s) => s.trim())
        .find((s) => s.startsWith(ownerCookie + '='))
        ?.slice(ownerCookie.length + 1);
      if (secret)
        await sql`delete from tamil_chat.limits where key=${`taie-owner:${owner.id}:${hash(secret)}`}`;
      response.cookies.set(ownerCookie, '', { ...cookieOptions, maxAge: 0 });
      response.cookies.set(sessionCookie, '', { ...chatOptions, maxAge: 0 });
      return response;
    }
    if (body.action === 'restore') {
      if (
        typeof body.secret !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/.test(body.secret)
      )
        throw new ChatError('Invalid return link.');
      const [person] =
        await sql`select s.id from tamil_chat.sessions s join tamil_chat.limits l
        on l.key=${'taie-contact:'}||s.id::text and l.expires_at>now()
        where s.token_hash=${hash(body.secret)} and s.expires_at>now() and not s.suspended`;
      if (!person) throw new ChatError('This return link is unavailable.', 404);
      const response = respond({ ok: true });
      response.cookies.set(contactCookie, body.secret, {
        ...cookieOptions,
        maxAge: 31536000,
      });
      return response;
    }
    let me = await contactIdentity(request);
    if (body.action === 'start' && !me) {
      if (body.accepted !== true)
        throw new ChatError('Acknowledge the archive notice first.');
      const name = textOf(body.name, 2, 24);
      if (
        !/^[\p{L}\p{M}\p{N} ._-]+$/u.test(name) ||
        /admin|owner|moderator|support/i.test(name)
      )
        throw new ChatError('Choose a nickname using letters or numbers.');
      const [host] =
        await sql`select id from tamil_chat.sessions where id=${owner.id} and not suspended and expires_at>now()`;
      if (!host)
        throw new ChatError(
          'The owner has not activated chat yet. Please try again later.',
          503,
        );
      await limit(`contact-new:${networkKey(request)}`, 8, 3600);
      const secret = token(),
        id = randomUUID();
      await sql.begin(async (tx) => {
        await tx`insert into tamil_chat.sessions(id,token_hash,name,archive_notice,expires_at)
          values(${id},${hash(secret)},${name},true,now()+interval '100 years')`;
        await tx`insert into tamil_chat.limits(key,count,expires_at) values(${contactMarker(id)},1,now()+interval '100 years')`;
      });
      me = { role: 'visitor', id, name, secret };
    }
    if (!me) throw new ChatError('Start your private chat first.', 401);
    if (body.action === 'return-link') {
      if (me.role !== 'visitor')
        throw new ChatError('Return links are for visitors.', 403);
      return respond({
        link: `${new URL(request.url).origin}/taie-contact#return=${me.secret}`,
      });
    }
    if (body.action !== 'start' && body.action !== 'open')
      throw new ChatError('Unknown action.');
    let roomId: string;
    if (me.role === 'owner') {
      roomId = validId(body.roomId);
      const [room] =
        await sql`select id from tamil_chat.rooms where id=${roomId} and host_id=${owner.id} and status='active' and expires_at>now()`;
      if (!room) throw new ChatError('This chat has ended.', 404);
    } else {
      const visitor = me;
      roomId = await sql.begin(async (tx) => {
        const [person] =
          await tx`select id from tamil_chat.sessions where id=${visitor.id} and not suspended and expires_at>now() for update`;
        const [host] =
          await tx`select id from tamil_chat.sessions where id=${owner.id} and not suspended and expires_at>now()`;
        if (!person || !host)
          throw new ChatError('This chat is unavailable.', 403);
        const blocked =
          await tx`select 1 from tamil_chat.blocks where (blocker_id=${owner.id} and blocked_id=${visitor.id}) or (blocker_id=${visitor.id} and blocked_id=${owner.id})`;
        if (blocked.length)
          throw new ChatError('This chat is unavailable.', 403);
        const [active] =
          await tx`select id from tamil_chat.rooms where host_id=${owner.id} and guest_id=${visitor.id} and status='active' and expires_at>now() order by created_at desc limit 1`;
        if (active) return active.id as string;
        const [rate] =
          await tx`insert into tamil_chat.limits as l(key,count,expires_at)
          values(${`contact-rooms:${visitor.id}`},1,now()+interval '1 hour')
          on conflict(key) do update set count=case when l.expires_at<now() then 1 else l.count+1 end,
            expires_at=case when l.expires_at<now() then excluded.expires_at else l.expires_at end returning count`;
        if (rate.count > 10)
          throw new ChatError('Please try again in an hour.', 429);
        const id = randomUUID();
        await tx`insert into tamil_chat.rooms(id,host_id,guest_id,source,status,archive_enabled)
          values(${id},${owner.id},${visitor.id},'link','active',true)`;
        return id;
      });
    }
    const response = respond({ roomId });
    response.cookies.set(sessionCookie, me.secret, {
      ...chatOptions,
      maxAge: me.role === 'owner' ? 604800 : 31536000,
    });
    if (me.role === 'visitor')
      response.cookies.set(contactCookie, me.secret, {
        ...cookieOptions,
        maxAge: 31536000,
      });
    return response;
  } catch (error) {
    return fail(error);
  }
}
