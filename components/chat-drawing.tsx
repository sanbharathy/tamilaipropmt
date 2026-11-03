'use client';
import { useEffect, useRef, useState } from 'react';
import {
  X,
  Undo2,
  Eraser,
  Pencil,
  ImagePlus,
  Send,
  LoaderCircle,
} from 'lucide-react';
import { compressChatImage } from '@/lib/chat-image-client';

export function ChatDrawing({
  initialImage,
  onSend,
  onClose,
}: {
  initialImage: File | null;
  onSend: (file: File) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    input = useRef<HTMLInputElement>(null),
    history = useRef<ImageData[]>([]),
    pointer = useRef<number | null>(null),
    previous = useRef({ x: 0, y: 0 }),
    job = useRef(0);
  const [white, setWhite] = useState(false),
    [size, setSize] = useState(5),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [undoCount, setUndoCount] = useState(0);
  const remember = () => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    history.current.push(context.getImageData(0, 0, 512, 512));
    if (history.current.length > 10) history.current.shift();
    setUndoCount(history.current.length);
  };
  async function background(file: File) {
    const current = ++job.current;
    setBusy(true);
    setError('');
    let url = '';
    try {
      const optimized = await compressChatImage(file);
      url = URL.createObjectURL(optimized);
      const image = new Image();
      image.src = url;
      await image.decode();
      if (current !== job.current) return;
      const context = canvas.current?.getContext('2d');
      if (!context) return;
      remember();
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 512, 512);
      const scale = Math.min(
          512 / image.naturalWidth,
          512 / image.naturalHeight,
        ),
        width = image.naturalWidth * scale,
        height = image.naturalHeight * scale;
      context.drawImage(
        image,
        (512 - width) / 2,
        (512 - height) / 2,
        width,
        height,
      );
      setDirty(true);
    } catch (error) {
      if (current === job.current)
        setError(
          error instanceof Error ? error.message : 'Unable to load photo.',
        );
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (current === job.current) setBusy(false);
    }
  }
  useEffect(() => {
    dialog.current?.showModal();
    const context = canvas.current?.getContext('2d');
    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 512, 512);
    }
    if (initialImage)
      void Promise.resolve().then(() => background(initialImage));
    return () => {
      // A cancellation counter, not a mounted DOM ref.
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      job.current++;
    };
    // The initial photo is a snapshot when the drawing panel opens.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * 512) / bounds.width,
      y: ((event.clientY - bounds.top) * 512) / bounds.height,
    };
  };
  function stroke(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.strokeStyle = white ? '#ffffff' : '#111111';
    context.fillStyle = context.strokeStyle;
    context.lineWidth = size;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.beginPath();
    context.arc(to.x, to.y, size / 2, 0, Math.PI * 2);
    context.fill();
  }
  async function send() {
    if (!dirty || busy || !canvas.current) return;
    setBusy(true);
    setError('');
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.current!.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('Unable to save drawing.');
      const file = await compressChatImage(
        new File([blob], 'drawing.png', { type: 'image/png' }),
      );
      onSend(file);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to save drawing.',
      );
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="drawing-title"
      className="messenger-drawing m-auto max-h-[94dvh] w-[calc(100%-16px)] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-3 text-[#193c37] backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="drawing-title" className="text-base font-bold">
            Draw & send
          </h2>
          <p className="text-[11px] text-[#698176]">
            Sketch a note or draw over a photo.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close drawing"
          onClick={onClose}
          className="grid size-11 place-items-center"
        >
          <X size={19} />
        </button>
      </div>
      <div
        className="my-2 flex flex-wrap items-center gap-1"
        aria-label="Drawing tools"
      >
        <button
          type="button"
          disabled={busy}
          aria-label="Black pen"
          aria-pressed={!white}
          onClick={() => setWhite(false)}
          className={`grid size-11 place-items-center rounded-xl ${!white ? 'bg-[#dcefe3]' : 'bg-[#f2f5f3]'}`}
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          disabled={busy}
          aria-label="White eraser"
          aria-pressed={white}
          onClick={() => setWhite(true)}
          className={`grid size-11 place-items-center rounded-xl ${white ? 'bg-[#dcefe3]' : 'bg-[#f2f5f3]'}`}
        >
          <Eraser size={18} />
        </button>
        <label className="sr-only" htmlFor="draw-width">
          Brush size
        </label>
        <select
          id="draw-width"
          disabled={busy}
          value={size}
          onChange={(event) => setSize(Number(event.target.value))}
          className="h-11 rounded-xl bg-[#f2f5f3] px-2 text-base"
        >
          <option value={3}>Thin</option>
          <option value={5}>Medium</option>
          <option value={12}>Thick</option>
        </select>
        <button
          type="button"
          disabled={busy || !undoCount}
          aria-label="Undo drawing"
          onClick={() => {
            const previous = history.current.pop();
            if (previous) {
              canvas.current?.getContext('2d')?.putImageData(previous, 0, 0);
              setUndoCount(history.current.length);
              setDirty(true);
            }
          }}
          className="grid size-11 place-items-center rounded-xl bg-[#f2f5f3] disabled:opacity-30"
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            remember();
            const context = canvas.current?.getContext('2d');
            if (context) {
              context.fillStyle = '#ffffff';
              context.fillRect(0, 0, 512, 512);
              setDirty(false);
            }
          }}
          className="h-11 rounded-xl bg-[#f2f5f3] px-3 text-xs font-semibold"
        >
          Clear
        </button>
      </div>
      {/* Pointer capture keeps drawing continuous; touch-action protects strokes from page scrolling. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <canvas
        ref={canvas}
        width={512}
        height={512}
        aria-label="Drawing canvas. Use a finger, mouse or pen to draw."
        className="mx-auto block aspect-square w-full max-w-[min(100%,48dvh)] touch-none rounded-2xl border border-[#d9e6dd] bg-white"
        onPointerDown={(event) => {
          if (busy || pointer.current !== null || event.button !== 0) return;
          event.preventDefault();
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          remember();
          previous.current = point(event);
          stroke(previous.current, previous.current);
          setDirty(true);
        }}
        onPointerMove={(event) => {
          if (pointer.current !== event.pointerId) return;
          const next = point(event);
          stroke(previous.current, next);
          previous.current = next;
        }}
        onPointerUp={() => {
          pointer.current = null;
        }}
        onPointerCancel={() => {
          pointer.current = null;
        }}
        onLostPointerCapture={() => {
          pointer.current = null;
        }}
      >
        Your browser does not support drawing.
      </canvas>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Drawing background photo"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void background(file);
        }}
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#edf4ef] px-3 text-xs font-bold"
        >
          <ImagePlus size={17} />
          Add photo
        </button>
        <button
          type="button"
          disabled={busy || !dirty}
          onClick={() => void send()}
          className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#148675] px-3 text-xs font-bold text-white disabled:opacity-40"
        >
          {busy ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Send size={17} />
          )}
          Send drawing
        </button>
      </div>
    </dialog>
  );
}
