import { chatDb, cleanup, fail, respond } from '@/lib/chat-server';
import { requireModerator } from '@/lib/chat-moderator';
import { scheduleArchives } from '@/lib/chat-archives';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireModerator(request);
    await cleanup();
    scheduleArchives();
    const archives =
      await chatDb()`select room_id,ended_at,expires_at,ready_at,pdf_sha256 from tamil_chat.archives where expires_at>now() order by ended_at desc limit 100`;
    return respond({ archives });
  } catch (error) {
    return fail(error);
  }
}
