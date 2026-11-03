import {
  chatDb,
  ChatError,
  cookieToken,
  fail,
  hash,
  moderatorCookie,
  validId,
} from '@/lib/chat-server';
import { imageResponse } from '@/lib/chat-images';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sql = chatDb();
    const secret = cookieToken(request, moderatorCookie);
    const [moderator] = secret
      ? await sql`select 1 from tamil_chat.moderators where token_hash=${hash(secret)} and expires_at>now()`
      : [];
    if (!moderator) throw new ChatError('Moderator sign-in required.', 401);
    const { id } = await params;
    validId(id);
    const [message] =
      await sql`select m.image_data,exists(select 1 from tamil_chat.limits l where l.key='camera:'||m.room_id::text||':'||m.id::text and l.expires_at>now()) as camera from tamil_chat.reports report join tamil_chat.messages m on m.id=report.message_id join tamil_chat.rooms r on r.id=m.room_id
      join tamil_chat.sessions h on h.id=r.host_id join tamil_chat.sessions g on g.id=r.guest_id
      where report.id=${id} and m.image_data is not null and r.status='active' and r.expires_at>now() and h.expires_at>now() and g.expires_at>now()`;
    if (!message)
      throw new ChatError('Image cleared or no longer available.', 404);
    return await imageResponse(message.image_data, message.camera);
  } catch (error) {
    return fail(error);
  }
}
