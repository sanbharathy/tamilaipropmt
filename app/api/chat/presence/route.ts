import {
  assertOrigin,
  bodyOf,
  chatDb,
  ChatError,
  fail,
  limit,
  respond,
  sessionOf,
  validId,
} from '@/lib/chat-server';
import { screenSequence, updatePresence } from '@/lib/chat-presence';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const body = await bodyOf(request),
      me = await sessionOf(request);
    await limit(`presence:${me.id}`, 90, 60);
    const roomId = validId(body.roomId),
      screen = validId(body.screen);
    if (body.present !== false)
      throw new ChatError('Unsupported presence update.');
    const [room] =
      await chatDb()`select id from tamil_chat.rooms where id=${roomId} and status='active' and expires_at>now() and (host_id=${me.id} or guest_id=${me.id})`;
    if (!room) throw new ChatError('Conversation not available.', 404);
    await updatePresence(
      roomId,
      me.id,
      screen,
      screenSequence(body.sequence),
      false,
    );
    return respond({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
