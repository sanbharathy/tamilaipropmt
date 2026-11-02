import { chatDb, ChatError, fail, limit, validId } from '@/lib/chat-server';
import { requireModerator } from '@/lib/chat-moderator';
import { decryptArchive, processArchives } from '@/lib/chat-archives';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireModerator(request);
    const id = validId((await params).id),
      sql = chatDb();
    await limit(`archive-download:${id}`, 10, 60);
    await processArchives(1, id);
    const [archive] =
      await sql`select pdf_data,pdf_sha256 from tamil_chat.archives where room_id=${id} and expires_at>now() for share`;
    if (!archive)
      throw new ChatError(
        'Archive unavailable, expired or still processing.',
        404,
      );
    if (!archive.pdf_data)
      throw new ChatError(
        'Archive is still processing. Please retry shortly.',
        503,
      );
    const pdf = decryptArchive(archive.pdf_data, id);
    await sql`insert into tamil_chat.archive_access(room_id) values(${id})`;
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="chat-${id}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
