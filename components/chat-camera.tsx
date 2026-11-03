'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  SwitchCamera,
  Video,
  X,
  LoaderCircle,
  Send,
  RotateCcw,
} from 'lucide-react';
import { compressChatImage } from '@/lib/chat-image-client';
import {
  CAMERA_FRAMES,
  CAMERA_FRAME_MS,
  CAMERA_FRAME_EDGE,
} from '@/lib/chat-camera';
type Capture = { file: File; motion: boolean; width: number; height: number };
export function ChatCamera({
  onUse,
  onClose,
}: {
  onUse: (file: File, motion: boolean) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    job = useRef(0),
    previewCanvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false),
    [busy, setBusy] = useState(false),
    [recording, setRecording] = useState(false),
    [seconds, setSeconds] = useState(5),
    [facing, setFacing] = useState<'user' | 'environment'>('user'),
    [capture, setCapture] = useState<Capture | null>(null),
    [poster, setPoster] = useState(''),
    [error, setError] = useState('');
  function release() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }
  useEffect(() => {
    dialog.current?.showModal();
    const hide = (event: Event) => {
      if (event.type === 'pagehide' || document.visibilityState === 'hidden') {
        job.current++;
        release();
        setLive(false);
        setBusy(false);
        setRecording(false);
      }
    };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', hide);
      // A cancellation counter for late camera permission/capture results.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      job.current++;
      release();
    };
  }, []);
  useEffect(() => {
    if (!capture) return;
    const url = URL.createObjectURL(capture.file);
    // Synchronize a local blob preview with its capture.
    // oxlint-disable-next-line
    setPoster(url);
    let bitmap: ImageBitmap | undefined,
      timer: ReturnType<typeof setInterval> | undefined,
      cancelled = false;
    if (capture.motion)
      void createImageBitmap(capture.file)
        .then((value) => {
          if (cancelled) {
            value.close();
            return;
          }
          bitmap = value;
          let frame = 0;
          const draw = () => {
            previewCanvas.current
              ?.getContext('2d')
              ?.drawImage(
                value,
                0,
                frame * capture.height,
                capture.width,
                capture.height,
                0,
                0,
                capture.width,
                capture.height,
              );
            frame = (frame + 1) % CAMERA_FRAMES;
          };
          draw();
          timer = setInterval(draw, CAMERA_FRAME_MS);
        })
        .catch(() =>
          setError('Unable to preview this recording. Please retake it.'),
        );
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      bitmap?.close();
      URL.revokeObjectURL(url);
    };
  }, [capture]);
  async function start(next = facing) {
    const current = ++job.current;
    release();
    setLive(false);
    setBusy(true);
    setCapture(null);
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          'Camera capture needs HTTPS and a supported browser. You can still choose a photo from + → Photos.',
        );
      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: next },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      if (current !== job.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const player = video.current;
      if (!player) throw new Error('Camera preview unavailable.');
      player.srcObject = media;
      await player.play();
      if (current === job.current) {
        setFacing(next);
        setLive(true);
      }
    } catch (error) {
      if (current === job.current) {
        release();
        setError(
          error instanceof DOMException && error.name === 'NotAllowedError'
            ? 'Camera access was denied. Allow camera access in your browser settings, then try again.'
            : error instanceof DOMException && error.name === 'NotFoundError'
              ? 'No camera was found. Use + → Photos to choose a picture.'
              : error instanceof Error
                ? error.message
                : 'Unable to open the camera.',
        );
      }
    } finally {
      if (current === job.current) setBusy(false);
    }
  }
  function drawFrame(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    offset = 0,
  ) {
    const player = video.current;
    if (
      !player ||
      !player.videoWidth ||
      !player.videoHeight ||
      player.readyState < 2
    )
      throw new Error('Camera is not ready. Please try again.');
    context.save();
    context.translate(0, offset);
    if (facing === 'user') {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(player, 0, 0, width, height);
    context.restore();
  }
  async function take(motion: boolean) {
    const player = video.current;
    if (!live || busy || !player) return;
    const current = ++job.current;
    setBusy(true);
    setRecording(motion);
    setError('');
    try {
      const edge = motion ? CAMERA_FRAME_EDGE : 1200,
        scale = Math.min(
          1,
          edge / Math.max(player.videoWidth, player.videoHeight),
        ),
        width = Math.max(32, Math.round(player.videoWidth * scale)),
        height = Math.max(32, Math.round(player.videoHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height * (motion ? CAMERA_FRAMES : 1);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Camera capture is unavailable.');
      const started = performance.now();
      for (let index = 0; index < (motion ? CAMERA_FRAMES : 1); index++) {
        if (current !== job.current) return;
        if (motion) {
          const wait = started + index * CAMERA_FRAME_MS - performance.now();
          if (wait > 0)
            await new Promise((resolve) => setTimeout(resolve, wait));
          if (current !== job.current) return;
          setSeconds(
            Math.max(1, 5 - Math.floor((index * CAMERA_FRAME_MS) / 1000)),
          );
        }
        drawFrame(context, width, height, index * height);
      }
      if (motion) {
        const wait =
          started + CAMERA_FRAMES * CAMERA_FRAME_MS - performance.now();
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      }
      if (current !== job.current) return;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', motion ? 0.65 : 0.82),
      );
      if (!blob || blob.size > 2 * 1024 * 1024)
        throw new Error(
          'Capture is too large. Please try a simpler background.',
        );
      const raw = new File(
          [blob],
          blob.type === 'image/webp' ? 'camera.webp' : 'camera.png',
          { type: blob.type },
        ),
        file = motion ? raw : await compressChatImage(raw);
      if (current !== job.current) return;
      release();
      setLive(false);
      setCapture({ file, motion, width, height });
    } catch (error) {
      if (current === job.current)
        setError(error instanceof Error ? error.message : 'Unable to capture.');
    } finally {
      if (current === job.current) {
        setBusy(false);
        setRecording(false);
        setSeconds(5);
      }
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="camera-title"
      className="messenger-dialog m-auto max-h-[94dvh] w-[calc(100%-16px)] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-3 text-[#193c37] backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="camera-title" className="font-bold">
            Chat camera
          </h2>
          <p className="text-[11px] text-[#617b6d]">
            Photo or a silent 5-second GIF
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="grid size-11 place-items-center"
        >
          <X size={19} />
        </button>
      </div>
      <div className="relative my-3 grid min-h-48 place-items-center overflow-hidden rounded-2xl bg-[#102823] text-white">
        {/* The camera stream stays local and is never recorded with audio. */}
        {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          className={`${live ? 'block' : 'hidden'} max-h-[46dvh] w-full object-contain ${facing === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        {capture?.motion ? (
          <canvas
            ref={previewCanvas}
            width={capture.width}
            height={capture.height}
            aria-label="Preview of your 5-second GIF"
            className="max-h-[46dvh] w-full object-contain"
          />
        ) : capture && poster ? (
          // A local object URL must never enter the public image optimizer.
          // oxlint-disable-next-line next/no-img-element
          <img
            src={poster}
            alt="Your capture preview"
            className="max-h-[46dvh] w-full object-contain"
          />
        ) : !live ? (
          <div className="p-5 text-center">
            <Camera size={36} className="mx-auto mb-3" />
            <p className="text-xs">
              Enable your camera to take a photo or record a GIF.
            </p>
          </div>
        ) : null}
        {recording && (
          <output className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold">
            ● Recording · {seconds}s
          </output>
        )}
      </div>
      {error && (
        <p role="alert" className="mb-3 text-xs leading-5 text-red-700">
          {error}
        </p>
      )}
      <p className="mb-3 text-[10px] leading-4 text-[#617b6d]">
        Camera only, no microphone. This website does not save captures to your
        gallery. Preview before sending. The chat’s 30-day security PDF policy
        still applies; GIFs appear as a still image in the PDF.
      </p>
      {capture ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void start()}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#edf4ef] text-xs font-bold"
          >
            <RotateCcw size={17} />
            Retake
          </button>
          <button
            type="button"
            onClick={() => onUse(capture.file, capture.motion)}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#148675] text-xs font-bold text-white"
          >
            <Send size={17} />
            {capture.motion ? 'Use GIF' : 'Use photo'}
          </button>
        </div>
      ) : live ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void take(false)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#edf4ef] text-xs font-bold disabled:opacity-40"
          >
            <Camera size={17} />
            Take photo
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void take(true)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#148675] text-xs font-bold text-white disabled:opacity-40"
          >
            {recording ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Video size={17} />
            )}
            5-second GIF
          </button>
          <button
            type="button"
            disabled={busy}
            aria-label="Switch camera"
            onClick={() =>
              void start(facing === 'user' ? 'environment' : 'user')
            }
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#edf4ef] disabled:opacity-40"
          >
            <SwitchCamera size={19} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#148675] text-sm font-bold text-white disabled:opacity-40"
        >
          {busy ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Camera size={18} />
          )}
          Enable camera
        </button>
      )}
    </dialog>
  );
}
