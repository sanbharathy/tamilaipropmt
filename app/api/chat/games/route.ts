import { randomUUID } from 'node:crypto';
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
import {
  advanceGame,
  GameRuleError,
  isGameKind,
  newChatGame,
} from '@/lib/chat-games';
import {
  GAME_PREFIX,
  gameMessage,
  latestGame,
  readGameMessage,
} from '@/lib/chat-game-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await bodyOf(request),
      me = await sessionOf(request),
      roomId = validId(body.roomId),
      clientId = validId(body.clientId),
      sql = chatDb();
    await limit(`game-actions:${me.id}`, 30, 60);
    await limit(`game-network:${networkKey(request)}`, 120, 300);
    if (body.action === 'start') await limit(`game-invites:${me.id}`, 10, 3600);
    const game = await sql.begin(async (tx) => {
      const [room] =
        await tx`select r.* from tamil_chat.rooms r join tamil_chat.sessions h on h.id=r.host_id join tamil_chat.sessions g on g.id=r.guest_id
        where r.id=${roomId} and (r.host_id=${me.id} or r.guest_id=${me.id}) and r.status='active' and r.expires_at>now() and h.expires_at>now() and g.expires_at>now() and not h.suspended and not g.suspended for update of r`;
      if (!room)
        throw new ChatError(
          'Only an accepted, active chat can play games.',
          403,
        );
      if (room.archive_enabled && !me.archive_notice)
        throw new ChatError('Acknowledge the chat privacy notice first.', 403);
      const blocked =
        await tx`select 1 from tamil_chat.blocks where (blocker_id=${room.host_id} and blocked_id=${room.guest_id}) or (blocker_id=${room.guest_id} and blocked_id=${room.host_id})`;
      if (blocked.length)
        throw new ChatError('This conversation is blocked.', 403);
      const events =
        await tx`select body,sender_id from tamil_chat.messages where room_id=${roomId} and image_data is null and removed_at is null and body like ${GAME_PREFIX + '%'} order by id desc limit 30`;
      const current = latestGame(events, roomId, room.host_id, room.guest_id);
      const [duplicate] =
        await tx`select room_id,body from tamil_chat.messages where sender_id=${me.id} and client_id=${clientId}`;
      if (duplicate) {
        if (
          duplicate.room_id !== roomId ||
          !readGameMessage(duplicate.body, roomId, me.id)
        )
          throw new ChatError('This request ID was already used.', 409);
        return current;
      }
      const [count] =
        await tx`select count(*)::int as count from tamil_chat.messages where room_id=${roomId}`;
      if (room.archive_enabled && count.count >= 1000)
        throw new ChatError(
          'This chat has reached its activity limit. Create a new chat to play again.',
          429,
        );
      let next;
      if (body.action === 'start') {
        if (current && ['invited', 'playing'].includes(current.phase))
          throw new ChatError('Finish or cancel the current game first.', 409);
        if (!isGameKind(body.kind))
          throw new ChatError('Choose one of the four games.');
        next = newChatGame(randomUUID(), roomId, body.kind, [
          me.id,
          room.host_id === me.id ? room.guest_id : room.host_id,
        ]);
      } else {
        if (
          !current ||
          body.gameId !== current.id ||
          body.expectedRevision !== current.revision
        )
          throw new ChatError(
            'The game changed. Please use the latest board.',
            409,
          );
        if (
          !['accept', 'decline', 'resign', 'move'].includes(String(body.action))
        )
          throw new ChatError('Invalid game action.');
        next = advanceGame(
          current,
          me.id,
          body.action as 'accept' | 'decline' | 'resign' | 'move',
          body.move,
        );
      }
      await tx`insert into tamil_chat.messages(room_id,sender_id,client_id,body) values(${roomId},${me.id},${clientId},${gameMessage(next)})`;
      return next;
    });
    return respond({ game });
  } catch (error) {
    return fail(
      error instanceof GameRuleError
        ? new ChatError(error.message, 409)
        : error,
    );
  }
}
