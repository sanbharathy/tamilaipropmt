'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ImageOff,
  X,
  ZoomIn,
  ZoomOut,
  Pencil,
  Minus,
  Undo2,
  Download,
  LoaderCircle,
} from 'lucide-react';
import { downloadChatImage } from '@/lib/chat-image-download';
type Point = { x: number; y: number };
type Stroke = { points: Point[]; color: string; width: number };
function paint(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const p of stroke.points.slice(1)) context.lineTo(p.x, p.y);
    context.stroke();
    if (stroke.points.length === 1) {
      context.beginPath();
      context.arc(
        stroke.points[0].x,
        stroke.points[0].y,
        stroke.width / 2,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }
}
export function ChatPhotoViewer({
  messageId,
  tamil,
  onClose,
}: {
  messageId: string;
  tamil: boolean;
  onClose: () => void;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [display, setDisplay] = useState({ width: 1, height: 1 });
  const dialog = useRef<HTMLDialogElement>(null),
    image = useRef<HTMLImageElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    strokes = useRef<Stroke[]>([]),
    active = useRef<{ id: number; stroke: Stroke; start: Point } | null>(null);
  const [zoom, setZoom] = useState(false),
    [drawing, setDrawing] = useState(false),
    [tool, setTool] = useState<'pen' | 'line'>('pen'),
    [color, setColor] = useState('#ef4444'),
    [width, setWidth] = useState(4),
    [count, setCount] = useState(0),
    [blob, setBlob] = useState<Blob | null>(null),
    [url, setUrl] = useState(''),
    [loaded, setLoaded] = useState(false),
    [failed, setFailed] = useState(false),
    [saving, setSaving] = useState(false),
    [feedback, setFeedback] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    let source = '';
    void fetch(`/api/chat/images/${messageId}`, {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw Error('Unavailable');
        const value = await response.blob();
        if (controller.signal.aborted) return;
        source = URL.createObjectURL(value);
        setBlob(value);
        setUrl(source);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (source) URL.revokeObjectURL(source);
    };
  }, [messageId]);
  useEffect(() => {
    if (!natural || !stage.current) return;
    const fit = () => {
      const host = stage.current!;
      const ratio = natural.width / natural.height;
      const width = zoom
        ? Math.max(1400, host.clientWidth - 24)
        : Math.max(
            1,
            Math.min(
              natural.width,
              host.clientWidth - 24,
              (host.clientHeight - 24) * ratio,
            ),
          );
      setDisplay({ width, height: width / ratio });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(stage.current);
    fit();
    return () => observer.disconnect();
  }, [natural, zoom]);
  function repaint(preview?: Stroke) {
    const ctx = canvas.current?.getContext('2d');
    if (ctx)
      paint(ctx, preview ? [...strokes.current, preview] : strokes.current);
  }
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const r = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(
          event.currentTarget.width,
          ((event.clientX - r.left) * event.currentTarget.width) / r.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          event.currentTarget.height,
          ((event.clientY - r.top) * event.currentTarget.height) / r.height,
        ),
      ),
    };
  }
  async function save() {
    if (!blob || !loaded || saving) return;
    setSaving(true);
    setFeedback('');
    try {
      let output = blob;
      if (strokes.current.length) {
        const result = document.createElement('canvas');
        result.width = canvas.current!.width;
        result.height = canvas.current!.height;
        const ctx = result.getContext('2d')!;
        ctx.drawImage(image.current!, 0, 0);
        ctx.drawImage(canvas.current!, 0, 0);
        output = await new Promise<Blob>((resolve, reject) =>
          result.toBlob(
            (value) =>
              value
                ? resolve(value)
                : reject(Error('Could not prepare drawing.')),
            'image/png',
          ),
        );
      }
      const result = await downloadChatImage(output);
      setFeedback(
        result.saved
          ? 'Image saved.'
          : result.cancelled
            ? 'Save cancelled. Your drawing is still here.'
            : 'Download started.',
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'Could not download image.',
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="photo-viewer-title"
      className="chat-photo-editor fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-[#0a1716] p-0 text-white backdrop:bg-black/85"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#112421] px-3 py-2">
          <div>
            <h2 id="photo-viewer-title" className="text-sm font-bold">
              {tamil ? 'பகிரப்பட்ட படம்' : 'Shared picture'}
            </h2>
            <p className="mt-1 text-[10px] text-white/65">
              {count
                ? 'Drawing is saved as a still image.'
                : 'View, draw and save a copy.'}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              disabled={!loaded || saving}
              onClick={() => {
                setDrawing(!drawing);
                setZoom(false);
              }}
              aria-label={drawing ? 'Finish drawing' : 'Draw on picture'}
              aria-pressed={drawing}
              className="grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-40"
            >
              <Pencil size={19} />
            </button>
            <button
              disabled={!loaded || drawing || saving}
              onClick={() => setZoom(!zoom)}
              aria-label={zoom ? 'Zoom out' : 'Zoom in'}
              className="grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-40"
            >
              {zoom ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
            </button>
            <button
              disabled={!loaded || saving}
              onClick={() => void save()}
              aria-label="Download picture"
              className="grid size-12 place-items-center rounded-full bg-white/10 disabled:opacity-40"
            >
              {saving ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <Download size={19} />
              )}
            </button>
            <button
              disabled={saving}
              onClick={onClose}
              aria-label="Close picture viewer"
              className="grid size-12 place-items-center rounded-full bg-white text-[#112421] disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        {drawing && (
          <section
            aria-label="Picture drawing tools"
            className="flex shrink-0 flex-wrap items-center justify-center gap-2 bg-[#19332e] px-3 py-2"
          >
            <button
              onClick={() => setTool('pen')}
              aria-label="Freehand pen"
              aria-pressed={tool === 'pen'}
              className={`grid size-12 place-items-center rounded-xl ${tool === 'pen' ? 'bg-white/25' : 'bg-white/10'}`}
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setTool('line')}
              aria-label="Straight line"
              aria-pressed={tool === 'line'}
              className={`grid size-12 place-items-center rounded-xl ${tool === 'line' ? 'bg-white/25' : 'bg-white/10'}`}
            >
              <Minus size={20} />
            </button>
            {['#ef4444', '#ffffff', '#111111', '#facc15', '#38bdf8'].map(
              (c) => (
                <button
                  key={c}
                  aria-label={
                    {
                      '#ef4444': 'Red',
                      '#ffffff': 'White',
                      '#111111': 'Black',
                      '#facc15': 'Yellow',
                      '#38bdf8': 'Blue',
                    }[c]
                  }
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className="grid size-10 place-items-center rounded-full"
                >
                  <span
                    style={{ background: c }}
                    className={`size-6 rounded-full border ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#19332e]' : 'border-white/40'}`}
                  />
                </button>
              ),
            )}
            <label className="sr-only" htmlFor="photo-stroke-width">
              Stroke width
            </label>
            <select
              id="photo-stroke-width"
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="h-12 rounded-xl bg-[#294b42] px-2 text-sm"
            >
              <option value={2}>Thin</option>
              <option value={4}>Medium</option>
              <option value={8}>Thick</option>
            </select>
            <button
              disabled={!count}
              onClick={() => {
                strokes.current.pop();
                setCount(strokes.current.length);
                repaint();
              }}
              aria-label="Undo stroke"
              className="grid size-12 place-items-center rounded-xl bg-white/10 disabled:opacity-40"
            >
              <Undo2 size={18} />
            </button>
            <button
              disabled={!count}
              onClick={() => {
                strokes.current = [];
                setCount(0);
                repaint();
              }}
              className="min-h-12 rounded-xl bg-white/10 px-3 text-xs disabled:opacity-40"
            >
              Clear strokes
            </button>
          </section>
        )}
        <div
          ref={stage}
          className="photo-editor-stage min-h-0 flex-1 overflow-auto p-3"
        >
          {failed ? (
            <div role="alert" className="m-auto max-w-xs text-center">
              <ImageOff className="mx-auto mb-4 size-10 text-white/50" />
              <p className="text-sm leading-7">
                This picture has been cleared or the chat has ended.
              </p>
            </div>
          ) : !url ? (
            <div className="m-auto text-sm text-white/70">Loading picture…</div>
          ) : (
            <div
              style={display}
              className={`photo-editor-surface ${zoom ? 'is-zoomed' : ''}`}
            >
              {/* Private images use a local object URL, never the public image optimizer. */}
              {/* oxlint-disable-next-line next/no-img-element */}
              <img
                ref={image}
                src={url}
                alt="Shared attachment"
                onError={() => setFailed(true)}
                onLoad={() => {
                  if (!image.current || !canvas.current) return;
                  canvas.current.width = image.current.naturalWidth;
                  canvas.current.height = image.current.naturalHeight;
                  repaint();
                  setNatural({
                    width: image.current.naturalWidth,
                    height: image.current.naturalHeight,
                  });
                  setLoaded(true);
                }}
              />
              {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <canvas
                ref={canvas}
                aria-label="Draw on shared picture"
                style={{
                  pointerEvents: drawing ? 'auto' : 'none',
                  touchAction: drawing ? 'none' : 'auto',
                }}
                onPointerDown={(event) => {
                  if (
                    !drawing ||
                    saving ||
                    active.current ||
                    strokes.current.length >= 50 ||
                    event.button !== 0
                  )
                    return;
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  const start = point(event);
                  const stroke = {
                    points: [start],
                    color,
                    width:
                      (width * event.currentTarget.width) /
                      event.currentTarget.getBoundingClientRect().width,
                  };
                  active.current = { id: event.pointerId, stroke, start };
                  repaint(stroke);
                }}
                onPointerMove={(event) => {
                  const current = active.current;
                  if (!current || current.id !== event.pointerId) return;
                  const next = point(event);
                  if (tool === 'line')
                    current.stroke.points = [current.start, next];
                  else if (current.stroke.points.length < 1500)
                    current.stroke.points.push(next);
                  repaint(current.stroke);
                }}
                onPointerUp={(event) => {
                  const current = active.current;
                  if (!current || current.id !== event.pointerId) return;
                  strokes.current.push(current.stroke);
                  active.current = null;
                  setCount(strokes.current.length);
                  repaint();
                }}
                onPointerCancel={() => {
                  active.current = null;
                  repaint();
                }}
                onLostPointerCapture={() => {
                  active.current = null;
                  repaint();
                }}
              >
                Drawing is not supported by this browser.
              </canvas>
            </div>
          )}
        </div>
        {feedback && (
          <output className="shrink-0 bg-[#112421] px-4 py-3 text-center text-xs leading-5">
            {feedback}
          </output>
        )}
      </div>
    </dialog>
  );
}
