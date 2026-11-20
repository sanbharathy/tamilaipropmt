import {
  CAMERA_FRAMES,
  CAMERA_FRAME_MS,
  CAMERA_FRAME_EDGE,
} from './chat-camera';

/** Decode a private native-camera video into the existing bounded frame sprite.
 * Only this silent sprite is uploaded; the source video is never sent. */
export async function nativeCameraSprite(
  file: File,
  cancelled = () => false,
): Promise<File> {
  if (!file.type.startsWith('video/') || file.size > 20 * 1024 * 1024)
    throw new Error('Choose a short camera video under 20 MB.');
  const url = URL.createObjectURL(file),
    video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  function wait(event: string, action: () => void) {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        video.removeEventListener(event, ready);
        video.removeEventListener('error', error);
      };
      const ready = () => {
        cleanup();
        resolve();
      };
      const error = () => {
        cleanup();
        reject(new Error('Unable to read this recording. Please retake it.'));
      };
      const timer = setTimeout(error, 5000);
      video.addEventListener(event, ready, { once: true });
      video.addEventListener('error', error, { once: true });
      try {
        action();
      } catch {
        error();
      }
    });
  }
  try {
    await wait('loadeddata', () => {
      video.src = url;
      video.load();
    });
    if (
      !video.videoWidth ||
      !video.videoHeight ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    )
      throw new Error('Unable to read this recording. Please retake it.');
    const scale = Math.min(
      1,
      CAMERA_FRAME_EDGE / Math.max(video.videoWidth, video.videoHeight),
    );
    const width = Math.max(32, Math.round(video.videoWidth * scale)),
      height = Math.max(32, Math.round(video.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height * CAMERA_FRAMES;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Camera processing is unavailable.');
    for (let i = 0; i < CAMERA_FRAMES; i++) {
      if (cancelled())
        throw new DOMException('Capture cancelled', 'AbortError');
      const target = Math.min(
        Math.max(0, video.duration - 0.02),
        (i * CAMERA_FRAME_MS) / 1000,
      );
      if (Math.abs(video.currentTime - target) > 0.001)
        await wait('seeked', () => {
          video.currentTime = target;
        });
      context.drawImage(video, 0, i * height, width, height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.65),
    );
    if (!blob || blob.size > 2 * 1024 * 1024)
      throw new Error(
        'This recording is too detailed. Try a simpler background.',
      );
    return new File(
      [blob],
      blob.type === 'image/webp' ? 'camera.webp' : 'camera.png',
      { type: blob.type },
    );
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
