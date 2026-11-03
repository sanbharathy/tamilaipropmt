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
import { chatTopics, type ChatMessage } from '@/lib/chat-types';
import { gameChoices } from '@/lib/chat-games';
import { scheduleArchives } from '@/lib/chat-archives';
import { screenSequence, updatePresence } from '@/lib/chat-presence';
import {
  REACTION_EMOJIS,
  REPLY_TEXT_LIMIT,
  type ChatReaction,
} from '@/lib/chat-interactions';
import {
  REACTION_PREFIX,
  readReply,
  readReaction,
  reservedInteraction,
  makeReply,
  replyQuote,
  messageId,
} from '@/lib/chat-interactions-server';
import {
  GAME_PREFIX,
  latestGame,
  readGameMessage,
} from '@/lib/chat-game-server';

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
    scheduleArchives();
    await sql`update tamil_chat.sessions set last_seen=now() where id=${me.id}`;
    const roomId = new URL(request.url).searchParams.get('room');
    if (roomId) validId(roomId);
    const rooms =
      await sql`select r.id,r.host_id,r.guest_id,r.source,r.status,r.created_at,r.expires_at,
      case when r.host_id=${me.id} then g.name else h.name end as peer_name,
      case when r.host_id=${me.id} then r.guest_read_id else r.host_read_id end::text as peer_read_id,
      case when r.host_id=${me.id} then r.guest_read_at else r.host_read_at end as peer_read_at,
      case when r.host_id=${me.id} then r.guest_id else r.host_id end as peer_id
      from tamil_chat.rooms r join tamil_chat.sessions h on h.id=r.host_id left join tamil_chat.sessions g on g.id=r.guest_id
      where (r.host_id=${me.id} or r.guest_id=${me.id}) and r.expires_at>now() and (${roomId}::uuid is null or r.id=${roomId}::uuid) order by r.created_at desc limit 30`;
    const room = roomId ? (rooms.find((r) => r.id === roomId) ?? null) : null;
    if (roomId && !room)
      throw new ChatError('Conversation not found or expired.', 404);
    if (room?.status === 'active') {
      const query = new URL(request.url).searchParams,
        screen = query.get('screen');
      if (screen && me.archive_notice)
        await updatePresence(
          room.id,
          me.id,
          validId(screen),
          screenSequence(query.get('sequence')),
          true,
          query.get('read'),
        );
      const [presence] = await sql`select max(last_seen) as peer_last_seen,
        coalesce(bool_or(present and last_seen>now()-interval '20 seconds'),false) as peer_viewing,
        max(last_seen+interval '20 seconds') filter(where present) as peer_active_until
        from tamil_chat.room_presence where room_id=${room.id} and session_id=${room.peer_id}`;
      Object.assign(room, presence);
    }
    const messages =
      room?.status === 'active'
        ? await sql`select id::text,sender_id,body,created_at,has_image,
          exists(select 1 from tamil_chat.limits l where l.key=${'seen:' + room.id + ':'}||m.id::text and l.expires_at>now()) as seen
          from (select id,sender_id,body,created_at,image_type is not null as has_image from tamil_chat.messages where room_id=${room.id} and removed_at is null order by id desc limit 100) m order by id`
        : [];
    const people = me.available
      ? await sql`select s.id,s.name,s.topic from tamil_chat.sessions s where s.available=true and s.suspended=false
      and s.id<>${me.id} and s.topic=${me.topic} and s.last_seen>now()-interval '50 seconds' and s.expires_at>now()
      and not exists(select 1 from tamil_chat.blocks b where (b.blocker_id=${me.id} and b.blocked_id=s.id) or (b.blocker_id=s.id and b.blocked_id=${me.id}))
      order by s.last_seen desc limit 20`
      : [];
    const gameRows =
      room?.status === 'active'
        ? await sql`select body,sender_id from tamil_chat.messages where room_id=${room.id} and image_data is null and removed_at is null and body like ${GAME_PREFIX + '%'} order by id desc limit 30`
        : [];
    const game =
      room?.status === 'active'
        ? latestGame(gameRows, room.id, room.host_id, room.guest_id)
        : null;
    const decoded = messages.map((row) => {
      const message = row as ChatMessage;
      const reply = room
        ? readReply(message.body, room.id, message.sender_id)
        : null;
      const reaction =
        room && !message.has_image
          ? readReaction(message.body, room.id, message.sender_id)
          : null;
      const gameEvent =
        room && !message.has_image
          ? readGameMessage(message.body, room.id, message.sender_id)
          : null;
      return {
        ...message,
        body:
          reply?.body ??
          (reaction
            ? `${reaction.emoji} ${reaction.active ? 'Reaction added' : 'Reaction removed'}`
            : gameEvent
              ? `🎮 ${gameChoices.find((choice) => choice.kind === gameEvent.kind)?.name}: ${gameEvent.phase === 'finished' ? 'game finished' : 'game activity'}. Open Games to play.`
              : message.body),
        reply: reply?.reply,
        game_event: !!gameEvent,
        reaction_event: !!reaction,
      };
    });
    const quotedIds = decoded.flatMap((message) =>
      message.reply ? [message.reply.id] : [],
    );
    const availableQuotes =
      room && quotedIds.length
        ? await sql`select id::text from tamil_chat.messages where room_id=${room.id} and removed_at is null and id::text in ${sql(quotedIds)}`
        : [];
    const quoteIds = new Set(availableQuotes.map((row) => row.id));
    const keys = room
      ? decoded
          .filter((message) => !message.game_event && !message.reaction_event)
          .flatMap((message) =>
            [me.id, room.peer_id]
              .filter(Boolean)
              .map((actor) => `reaction:${room.id}:${message.id}:${actor}`),
          )
      : [];
    const reactionRows = keys.length
      ? await sql`select key,count from tamil_chat.limits where key in ${sql(keys)} and expires_at>now() and count between 1 and ${REACTION_EMOJIS.length}`
      : [];
    const badges = new Map<string, ChatReaction[]>();
    for (const row of reactionRows) {
      const [, , target, actor] = row.key.split(':');
      const emoji = REACTION_EMOJIS[row.count - 1];
      const list = badges.get(target) ?? [];
      let badge = list.find((item) => item.emoji === emoji);
      if (!badge) {
        badge = { emoji, count: 0, mine: false };
        list.push(badge);
      }
      badge.count++;
      badge.mine ||= actor === me.id;
      badges.set(target, list);
    }
    const reactionRowsForEffects =
      room?.status === 'active'
        ? await sql`select id::text,body,sender_id,created_at from tamil_chat.messages where room_id=${room.id} and image_data is null and removed_at is null and body like ${REACTION_PREFIX + '%'} order by id desc limit 30`
        : [];
    const reactionEvents = reactionRowsForEffects.flatMap((row) => {
      const event = readReaction(row.body, room!.id, row.sender_id);
      return event
        ? [
            {
              id: row.id,
              actor_id: row.sender_id,
              created_at: row.created_at,
              ...event,
            },
          ]
        : [];
    });
    return respond({
      me: {
        id: me.id,
        name: me.name,
        available: me.available,
        topic: me.topic,
        archive_notice: me.archive_notice,
      },
      rooms,
      room,
      messages: decoded.map((message) => ({
        ...message,
        reply: message.reply
          ? {
              ...message.reply,
              ...(!quoteIds.has(message.reply.id)
                ? { preview: 'Message unavailable', available: false }
                : {}),
            }
          : undefined,
        reactions: badges.get(message.id) ?? [],
      })),
      reaction_events: reactionEvents,
      server_time: new Date().toISOString(),
      game,
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
      if (body.archiveConsent !== true)
        throw new ChatError(
          'Please refresh and acknowledge the 30-day security archive notice.',
        );
      await sql`insert into tamil_chat.sessions(id,token_hash,name,archive_notice) values(${randomUUID()},${hash(secret)},${name},true)`;
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
    scheduleArchives();
    if (body.action === 'archive-consent') {
      if (body.accepted !== true)
        throw new ChatError('Acknowledge the archive notice to continue.');
      await sql`update tamil_chat.sessions set archive_notice=true where id=${me.id}`;
      return respond({ ok: true });
    }

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
        await tx`update tamil_chat.rooms set status='ended',end_reason='guest_logout',invite_hash=null where host_id=${me.id} or guest_id=${me.id}`;
      });
      const response = respond({ ok: true });
      response.cookies.set(sessionCookie, '', { path: '/api/chat', maxAge: 0 });
      return response;
    }
    if (body.action === 'create' || body.action === 'request') {
      if (!me.archive_notice)
        throw new ChatError(
          'Please acknowledge the 30-day security archive notice first.',
          403,
        );
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
          await tx`insert into tamil_chat.rooms(id,host_id,guest_id,invite_hash,source,archive_enabled) values(${randomUUID()},${me.id},${peer},${invite ? hash(invite) : null},${peer ? 'directory' : 'link'},true) returning id`;
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
          if (room.archive_enabled && !me.archive_notice)
            throw new ChatError(
              'Please acknowledge the security archive notice before joining.',
              403,
            );
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
    if (
      room.archive_enabled &&
      !me.archive_notice &&
      ['send', 'accept'].includes(String(body.action))
    )
      throw new ChatError(
        'Please acknowledge the security archive notice first.',
        403,
      );
    const peer = room.host_id === me.id ? room.guest_id : room.host_id;
    if (body.action === 'accept' || body.action === 'decline') {
      if (
        room.guest_id !== me.id ||
        room.status !== 'pending' ||
        room.source !== 'directory'
      )
        throw new ChatError('Only the invited person can respond.', 403);
      await sql`update tamil_chat.rooms set status=${body.action === 'accept' ? 'active' : 'declined'},end_reason=${body.action === 'decline' ? 'declined' : null} where id=${roomId} and status='pending'`;
      return respond({ ok: true });
    }
    if (body.action === 'destroy' && room.host_id !== me.id)
      throw new ChatError('Only the creator can destroy this invitation.', 403);
    if (
      body.action === 'end' ||
      body.action === 'block' ||
      body.action === 'destroy'
    ) {
      await sql.begin(async (tx) => {
        await tx`select id from tamil_chat.rooms where id=${roomId} for update`;
        await tx`update tamil_chat.rooms set status='ended',invite_hash=null,end_reason=${String(body.action)} where id=${roomId}`;
        if (body.action === 'block' && peer) {
          await tx`insert into tamil_chat.blocks(blocker_id,blocked_id) values(${me.id},${peer}) on conflict do nothing`;
          await tx`update tamil_chat.rooms set status='ended',invite_hash=null,end_reason='block' where (host_id=${me.id} and guest_id=${peer}) or (host_id=${peer} and guest_id=${me.id})`;
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
      const replyTo =
        body.replyTo === undefined || body.replyTo === null
          ? null
          : messageId(body.replyTo);
      const message = textOf(body.text, 1, replyTo ? REPLY_TEXT_LIMIT : 1200);
      if (message.startsWith(GAME_PREFIX) || reservedInteraction(message))
        throw new ChatError(
          'Game cards can only be sent using the game controls.',
        );
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
        const [count] =
          await tx`select count(*)::int as count from tamil_chat.messages where room_id=${roomId}`;
        if (room.archive_enabled && count.count >= 1000)
          throw new ChatError(
            'This chat has reached its 1,000-message limit. Please end it and create a new link.',
            429,
          );
        let stored = message;
        if (replyTo) {
          const [target] =
            await tx`select id::text,sender_id,body,image_type is not null as has_image from tamil_chat.messages where id=${replyTo} and room_id=${roomId} and removed_at is null`;
          if (
            !target ||
            target.body.startsWith(GAME_PREFIX) ||
            target.body.startsWith(REACTION_PREFIX)
          )
            throw new ChatError(
              'The message you are replying to is no longer available.',
              404,
            );
          stored = makeReply(
            message,
            replyQuote(
              {
                id: target.id,
                sender_id: target.sender_id,
                body: target.body,
                has_image: target.has_image,
              },
              roomId,
            ),
            roomId,
            me.id,
          );
        }
        await tx`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${roomId},${me.id},${clientId},${stored}) on conflict(sender_id,client_id) do nothing`;
      });
      return respond({ ok: true });
    }
    throw new ChatError('Unknown chat action.');
  } catch (error) {
    return fail(error);
  }
}
