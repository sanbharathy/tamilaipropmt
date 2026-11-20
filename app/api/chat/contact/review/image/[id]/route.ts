import { randomUUID } from 'node:crypto';
import { chatDb, ChatError, fail, limit } from '@/lib/chat-server';
import { contactIdentity } from '@/lib/chat-contact';
import { imageResponse } from '@/lib/chat-images';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const owner = await contactIdentity(request);
    if (owner?.role !== 'owner')
      throw new ChatError('Owner sign-in required.', 401);
    await limit(`taie-review-image:${owner.id}`, 60, 60);
    const { id } = await params;
    if (!/^\d{1,20}$/.test(id)) throw new ChatError('Image not found.', 404);
    const sql = chatDb();
    const [message] =
      await sql`select m.image_data,m.room_id,exists(select 1 from tamil_chat.limits c where c.key='camera:'||m.room_id::text||':'||m.id::text and c.expires_at>now()) as camera from tamil_chat.messages m join tamil_chat.rooms r on r.id=m.room_id join tamil_chat.limits l on l.key='taie-review:'||r.id::text and l.expires_at>now() where m.id=${id} and m.image_data is not null and m.removed_at is null and r.status='active' and r.expires_at>now()`;
    if (!message) throw new ChatError('Image cleared or chat ended.', 404);
    await sql`insert into tamil_chat.limits(key,count,expires_at) values(${'taie-review-image-audit:' + owner.id + ':' + message.room_id + ':' + id + ':' + randomUUID()},1,now()+interval '30 days')`;
    return await imageResponse(message.image_data, message.camera);
  } catch (error) {
    return fail(error);
  }
}
