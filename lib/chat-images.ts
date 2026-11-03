import { cameraGif } from '@/lib/chat-camera-server';
import { ChatError } from '@/lib/chat-server';

export const imageHeaders = {
  'Content-Type': 'image/webp',
  'Cache-Control': 'private, no-store, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
};
export async function imageResponse(data: Uint8Array, camera = false) {
  const gif = await cameraGif(Buffer.from(data), camera);
  return new Response(new Uint8Array(gif ?? data), {
    headers: {
      ...imageHeaders,
      ...(gif
        ? {
            'Content-Type': 'image/gif',
            'Content-Disposition': 'inline; filename="chat-camera.gif"',
          }
        : {}),
    },
  });
}
export async function uploadForm(request: Request) {
  const maximum = 2 * 1024 * 1024 + 16384;
  if (Number(request.headers.get('content-length') ?? 0) > maximum)
    throw new ChatError('Choose an image smaller than 2 MB.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError('Choose an image.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new ChatError('Choose an image smaller than 2 MB.', 413);
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Response(bytes, {
      headers: { 'Content-Type': request.headers.get('content-type')! },
    }).formData();
  } catch {
    throw new ChatError('Invalid image upload.');
  }
}
