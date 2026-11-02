import { timingSafeEqual } from 'node:crypto';
import { cleanup, fail, hash, respond, ChatError } from '@/lib/chat-server';
import { processArchives } from '@/lib/chat-archives';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const expected = process.env.CRON_SECRET,
      provided = request.headers.get('authorization');
    if (
      !expected ||
      !provided ||
      !timingSafeEqual(
        Buffer.from(hash(provided)),
        Buffer.from(hash(`Bearer ${expected}`)),
      )
    )
      throw new ChatError('Not authorized.', 401);
    await cleanup();
    let processed = 0;
    const start = Date.now();
    while (Date.now() - start < 45000) {
      const count = await processArchives(1);
      if (!count) break;
      processed += count;
    }
    return respond({ ok: true, processed });
  } catch (error) {
    return fail(error);
  }
}
