import sharp from 'sharp';
import {
  assertOrigin,
  chatDb,
  ChatError,
  cleanup,
  fail,
  limit,
  networkKey,
  respond,
  sessionOf,
  textOf,
  validId,
} from '@/lib/chat-server';
import { uploadForm } from '@/lib/chat-images';
import { scheduleArchives } from '@/lib/chat-archives';
import { GAME_PREFIX } from '@/lib/chat-game-server';
import {
  REACTION_PREFIX,
  reservedInteraction,
  makeReply,
  replyQuote,
  messageId,
} from '@/lib/chat-interactions-server';
import { REPLY_TEXT_LIMIT } from '@/lib/chat-interactions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertOrigin(request, 'multipart/form-data');
    const me = await sessionOf(request);
    await limit(`image-attempts:${me.id}`, 20, 3600);
    await limit(`image-network:${networkKey(request)}`, 30, 3600);
    await cleanup();
    scheduleArchives();
    const form = await uploadForm(request);
    const roomId = validId(form.get('roomId'));
    const clientId = validId(form.get('clientId'));
    const rawCaption = form.get('caption');
    const rawReply = form.get('replyTo');
    const replyTo = rawReply === null ? null : messageId(rawReply);
    const caption =
      typeof rawCaption === 'string' && rawCaption.trim()
        ? textOf(rawCaption, 1, replyTo ? REPLY_TEXT_LIMIT : 1200)
        : '📷 Shared image';
    if (caption.startsWith(GAME_PREFIX) || reservedInteraction(caption))
      throw new ChatError('Choose a normal caption for this picture.');
    const sql = chatDb();
    const [allowed] =
      await sql`select id,archive_enabled from tamil_chat.rooms where id=${roomId} and (host_id=${me.id} or guest_id=${me.id}) and status='active' and expires_at>now()`;
    if (!allowed)
      throw new ChatError(
        'Only participants in an accepted, active chat can share images.',
        403,
      );
    const file = form.get('image');
    if (allowed.archive_enabled && !me.archive_notice)
      throw new ChatError(
        'Please acknowledge the security archive notice first.',
        403,
      );
    if (
      !(file instanceof File) ||
      form.getAll('image').length !== 1 ||
      file.size === 0 ||
      file.size > 2 * 1024 * 1024
    )
      throw new ChatError(
        'Choose one JPG, PNG or WebP image smaller than 2 MB.',
        413,
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      ? 'image/jpeg'
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'image/png'
        : bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP'
          ? 'image/webp'
          : null;
    if (!kind || file.type !== kind)
      throw new ChatError('Only valid JPG, PNG and WebP images are supported.');
    let image: Buffer;
    try {
      const input = sharp(bytes, {
        limitInputPixels: 16000000,
        failOn: 'warning',
      });
      const metadata = await input.metadata();
      if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1)
        throw new Error();
      image = await input
        .rotate()
        .resize({
          width: 1200,
          height: 1200,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 76 })
        .toBuffer();
    } catch {
      throw new ChatError(
        'This image cannot be processed. Try a smaller, non-animated JPG, PNG or WebP.',
      );
    }
    if (image.byteLength > 524288)
      throw new ChatError(
        'This image is too detailed. Please choose a smaller image.',
        413,
      );
    const result = await sql.begin(async (tx) => {
      const [room] =
        await tx`select host_id,guest_id,status from tamil_chat.rooms where id=${roomId} and expires_at>now() for update`;
      if (room?.status !== 'active' || !room.guest_id)
        throw new ChatError('The chat has ended. Images were not saved.', 403);
      const blocked =
        await tx`select 1 from tamil_chat.blocks where (blocker_id=${room.host_id} and blocked_id=${room.guest_id}) or (blocker_id=${room.guest_id} and blocked_id=${room.host_id})`;
      if (blocked.length) throw new ChatError('This chat is blocked.', 403);
      const [existing] =
        await tx`select id::text from tamil_chat.messages where sender_id=${me.id} and client_id=${clientId}`;
      if (existing) return existing;
      const [total] =
        await tx`select count(*)::int as count from tamil_chat.messages where room_id=${roomId}`;
      if (allowed.archive_enabled && total.count >= 1000)
        throw new ChatError(
          'This chat has reached its 1,000-message limit.',
          429,
        );
      const [count] =
        await tx`select count(*)::int as count from tamil_chat.messages where room_id=${roomId} and image_data is not null`;
      if (count.count >= 10)
        throw new ChatError('This chat has reached its 10-image limit.', 429);
      let stored = caption;
      if (replyTo) {
        const [target] =
          await tx`select id::text,sender_id,body,image_type is not null as has_image from tamil_chat.messages where id=${replyTo} and room_id=${roomId} and removed_at is null`;
        if (
          !target ||
          target.body.startsWith(GAME_PREFIX) ||
          target.body.startsWith(REACTION_PREFIX)
        )
          throw new ChatError(
            'The message you are replying to is no longer available.',
            404,
          );
        stored = makeReply(
          caption,
          replyQuote(
            {
              id: target.id,
              sender_id: target.sender_id,
              body: target.body,
              has_image: target.has_image,
            },
            roomId,
          ),
          roomId,
          me.id,
        );
      }
      const [message] =
        await tx`insert into tamil_chat.messages(room_id,sender_id,client_id,body,image_data,image_type) values(${roomId},${me.id},${clientId},${stored},${image},'image/webp') returning id::text`;
      return message;
    });
    return respond({ ok: true, messageId: result.id });
  } catch (error) {
    return fail(error);
  }
}
