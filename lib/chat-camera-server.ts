import sharp from 'sharp';
import { ChatError } from './chat-server';
import {
  CAMERA_FRAMES,
  CAMERA_FRAME_MS,
  CAMERA_FRAME_EDGE,
} from './chat-camera';
/** Frames arrive as one bounded sprite; the stored private WebP preserves every frame. */
export async function normalizeCameraMotion(bytes: Buffer): Promise<Buffer> {
  const input = sharp(bytes, { limitInputPixels: 16000000, failOn: 'warning' }),
    meta = await input.metadata();
  const height = (meta.height ?? 0) / CAMERA_FRAMES;
  if (
    (meta.pages ?? 1) !== 1 ||
    !meta.width ||
    meta.width > CAMERA_FRAME_EDGE ||
    !Number.isInteger(height) ||
    height < 32 ||
    height > CAMERA_FRAME_EDGE
  )
    throw new ChatError('Invalid camera recording. Please record it again.');
  const { data, info } = await input
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
      pageHeight: height,
    },
  })
    .webp({
      quality: 55,
      effort: 3,
      loop: 0,
      delay: Array(CAMERA_FRAMES).fill(CAMERA_FRAME_MS),
    })
    .toBuffer();
  if (output.length > 524288)
    throw new ChatError(
      'This recording is too detailed. Please try a simpler background.',
      413,
    );
  return output;
}
/** GIF is delivered to the recipient; no image is put in a public/shared cache. */
export async function cameraGif(
  bytes: Buffer,
  force = false,
): Promise<Buffer | null> {
  // Static WebP files avoid the animation decoder entirely.
  if (!force && !bytes.subarray(12, 64).includes(Buffer.from('ANIM')))
    return null;
  const input = sharp(bytes, { animated: true, limitInputPixels: 16000000 }),
    meta = await input.metadata();
  if ((meta.pages ?? 1) === 1 && !force) return null;
  if (
    (meta.pages ?? 1) > CAMERA_FRAMES ||
    !meta.width ||
    meta.width > CAMERA_FRAME_EDGE ||
    (meta.pageHeight ?? meta.height ?? 0) > CAMERA_FRAME_EDGE
  )
    throw new ChatError('This recording is unavailable.', 404);
  const delays =
    (meta.pages ?? 1) > 1
      ? (meta.delay ?? CAMERA_FRAME_MS)
      : CAMERA_FRAMES * CAMERA_FRAME_MS;
  let gif = await input
    .gif({ colours: 64, dither: 0.2, effort: 3, loop: 0, delay: delays })
    .toBuffer();
  if (gif.length > 524288)
    gif = await sharp(bytes, { animated: true, limitInputPixels: 16000000 })
      .resize({
        width: 192,
        height: 192,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .gif({ colours: 32, dither: 0, effort: 3, loop: 0, delay: delays })
      .toBuffer();
  if (gif.length > 1048576)
    throw new ChatError('This recording cannot be displayed.', 413);
  return gif;
}
