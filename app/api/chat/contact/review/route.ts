import {
  chatDb,
  ChatError,
  fail,
  limit,
  respond,
  validId,
} from '@/lib/chat-server';
import { contactIdentity } from '@/lib/chat-contact';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const owner = await contactIdentity(request);
    if (owner?.role !== 'owner')
      throw new ChatError('Owner sign-in required.', 401);
    await limit(`taie-review-poll:${owner.id}`, 80, 60);
    const sql = chatDb();
    const rooms =
      await sql`select r.id,r.status,r.expires_at,h.name as host_name,g.name as guest_name from tamil_chat.rooms r join tamil_chat.sessions h on h.id=r.host_id left join tamil_chat.sessions g on g.id=r.guest_id join tamil_chat.limits l on l.key='taie-review:'||r.id::text and l.expires_at>now() where r.status in ('pending','active') and r.expires_at>now() order by r.created_at desc limit 100`;
    const roomId = new URL(request.url).searchParams.get('room');
    if (!roomId) return respond({ rooms, messages: [] });
    validId(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (!room)
      throw new ChatError(
        'This reviewable chat has ended or is unavailable.',
        404,
      );
    const messages =
      await sql`select m.id::text,m.body,m.created_at,s.name as sender_name,m.image_data is not null as has_image from (select * from tamil_chat.messages where room_id=${roomId} and removed_at is null order by id desc limit 100) m join tamil_chat.sessions s on s.id=m.sender_id order by m.id`;
    await sql`insert into tamil_chat.limits(key,count,expires_at) values(${'taie-review-audit:' + owner.id + ':' + roomId + ':' + Math.floor(Date.now() / 60000)},1,now()+interval '30 days') on conflict(key) do update set count=tamil_chat.limits.count+1`;
    return respond({ rooms, room, messages });
  } catch (error) {
    return fail(error);
  }
}
