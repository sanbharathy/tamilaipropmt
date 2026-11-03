import { chatDb, ChatError, fail, sessionOf } from '@/lib/chat-server';
import { imageResponse } from '@/lib/chat-images';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const me = await sessionOf(request);
    const { id } = await params;
    if (!/^\d{1,20}$/.test(id)) throw new ChatError('Image not found.', 404);
    const sql = chatDb();
    const [message] =
      await sql`select m.image_data,exists(select 1 from tamil_chat.limits l where l.key='camera:'||m.room_id::text||':'||m.id::text and l.expires_at>now()) as camera from tamil_chat.messages m join tamil_chat.rooms r on r.id=m.room_id
      join tamil_chat.sessions h on h.id=r.host_id join tamil_chat.sessions g on g.id=r.guest_id
      where m.id=${id} and m.image_data is not null and m.removed_at is null and (r.host_id=${me.id} or r.guest_id=${me.id}) and r.status='active'
      and r.expires_at>now() and h.expires_at>now() and g.expires_at>now() and h.suspended=false and g.suspended=false`;
    if (!message) throw new ChatError('Image not found or chat ended.', 404);
    return await imageResponse(message.image_data, message.camera);
  } catch (error) {
    return fail(error);
  }
}
