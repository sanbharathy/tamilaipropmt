import {
  assertOrigin,
  bodyOf,
  chatDb,
  ChatError,
  fail,
  limit,
  networkKey,
  respond,
  sessionOf,
  validId,
} from '@/lib/chat-server';
import { REACTION_EMOJIS } from '@/lib/chat-interactions';
import {
  makeReaction,
  messageId,
  readReaction,
  REACTION_PREFIX,
} from '@/lib/chat-interactions-server';
import { GAME_PREFIX } from '@/lib/chat-game-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await bodyOf(request),
      me = await sessionOf(request),
      roomId = validId(body.roomId),
      target = messageId(body.messageId),
      clientId = validId(body.clientId),
      index = REACTION_EMOJIS.findIndex((emoji) => emoji === body.emoji),
      sql = chatDb();
    if (index < 0)
      throw new ChatError('Choose one of the available reactions.');
    await limit(`reactions:${me.id}`, 20, 60);
    await limit(`reaction-network:${networkKey(request)}`, 120, 300);
    const result = await sql.begin(async (tx) => {
      const [room] =
        await tx`select r.* from tamil_chat.rooms r join tamil_chat.sessions h on h.id=r.host_id join tamil_chat.sessions g on g.id=r.guest_id where r.id=${roomId} and (r.host_id=${me.id} or r.guest_id=${me.id}) and r.status='active' and r.expires_at>now() and h.expires_at>now() and g.expires_at>now() and not h.suspended and not g.suspended for update of r`;
      if (!room) throw new ChatError('This chat is not available.', 403);
      if (room.archive_enabled && !me.archive_notice)
        throw new ChatError('Acknowledge the chat privacy notice first.', 403);
      const blocked =
        await tx`select 1 from tamil_chat.blocks where (blocker_id=${room.host_id} and blocked_id=${room.guest_id}) or (blocker_id=${room.guest_id} and blocked_id=${room.host_id})`;
      if (blocked.length) throw new ChatError('This chat is blocked.', 403);
      const [message] =
        await tx`select body from tamil_chat.messages where id=${target} and room_id=${roomId} and removed_at is null`;
      if (
        !message ||
        message.body.startsWith(GAME_PREFIX) ||
        message.body.startsWith(REACTION_PREFIX)
      )
        throw new ChatError('That message is no longer available.', 404);
      const [duplicate] =
        await tx`select room_id,body from tamil_chat.messages where sender_id=${me.id} and client_id=${clientId}`;
      if (duplicate) {
        if (
          duplicate.room_id !== roomId ||
          !readReaction(duplicate.body, roomId, me.id)
        )
          throw new ChatError('This request ID was already used.', 409);
        return { ok: true };
      }
      const [count] =
        await tx`select count(*)::int as count from tamil_chat.messages where room_id=${roomId}`;
      if (room.archive_enabled && count.count >= 1000)
        throw new ChatError('This chat has reached its activity limit.', 429);
      const key = `reaction:${roomId}:${target}:${me.id}`;
      const [previous] =
        await tx`select count from tamil_chat.limits where key=${key} and expires_at>now()`;
      const active = previous?.count !== index + 1;
      await tx`insert into tamil_chat.limits(key,count,expires_at) values(${key},${active ? index + 1 : 0},${room.expires_at}) on conflict(key) do update set count=excluded.count,expires_at=excluded.expires_at`;
      await tx`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${roomId},${me.id},${clientId},${makeReaction(target, REACTION_EMOJIS[index], active, roomId, me.id)})`;
      return { ok: true, active };
    });
    return respond(result);
  } catch (error) {
    return fail(error);
  }
}
