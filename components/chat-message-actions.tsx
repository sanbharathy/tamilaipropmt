'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  MoreHorizontal,
  Plus,
  ImagePlus,
  Smile,
  Gamepad2,
  Pencil,
  Camera,
  X,
} from 'lucide-react';
import { chatStickerPreview, findChatSticker } from '@/lib/chat-stickers';
import { copyChatLink } from '@/lib/chat-copy';
import { REACTION_EMOJIS } from '@/lib/chat-interactions';
import type { ChatMessage } from '@/lib/chat-types';

export function MessagePressable({
  children,
  onOpen,
  onReply,
}: {
  children: ReactNode;
  onOpen: (bounds: DOMRect) => void;
  onReply: () => void;
}) {
  const article = useRef<HTMLElement>(null);
  const openActions = () => {
    if (article.current) onOpen(article.current.getBoundingClientRect());
  };
  const [offset, setOffset] = useState(0);
  const gesture = useRef<{ id: number; dx: number; cancelled: boolean } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    start = useRef({ x: 0, y: 0 }),
    held = useRef(false);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);
  // Long-press supplements the keyboard-accessible action button below.
  // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      ref={article}
      className="message-pressable group relative min-w-0 max-w-[88%] sm:max-w-[72%]"
      style={{
        transform: `translateX(${offset}px)`,
        transition: offset ? 'none' : 'transform 160ms ease-out',
        touchAction: 'pan-y pinch-zoom',
      }}
      onPointerDown={(event) => {
        const control = (event.target as Element).closest(
          'button,input,textarea,video',
        );
        if (
          event.button !== 0 ||
          (control && !control.classList.contains('messenger-photo'))
        )
          return;
        clear();
        held.current = false;
        start.current = { x: event.clientX, y: event.clientY };
        gesture.current =
          event.pointerType === 'mouse'
            ? null
            : { id: event.pointerId, dx: 0, cancelled: false };
        timer.current = setTimeout(() => {
          held.current = true;
          openActions();
        }, 450);
      }}
      onPointerMove={(event) => {
        const current = gesture.current;
        if (current && current.id === event.pointerId && !held.current) {
          const dx = event.clientX - start.current.x,
            dy = event.clientY - start.current.y;
          current.dx = dx;
          if (dx <= 12) setOffset(0);
          if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) {
            current.cancelled = true;
            setOffset(0);
          }
          if (!current.cancelled && dx > 12 && dx > Math.abs(dy) * 1.5) {
            clear();
            setOffset(Math.min(48, dx * 0.6));
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }
        if (
          Math.hypot(
            event.clientX - start.current.x,
            event.clientY - start.current.y,
          ) > 8
        )
          clear();
      }}
      onPointerUp={() => {
        clear();
        const current = gesture.current;
        gesture.current = null;
        setOffset(0);
        if (
          current &&
          !current.cancelled &&
          current.dx >= 60 &&
          !held.current
        ) {
          held.current = true;
          onReply();
        }
      }}
      onPointerCancel={() => {
        clear();
        gesture.current = null;
        setOffset(0);
      }}
      onPointerLeave={clear}
      onContextMenu={(event) => {
        event.preventDefault();
        clear();
        openActions();
      }}
      onClickCapture={(event) => {
        if (held.current) {
          event.preventDefault();
          event.stopPropagation();
          held.current = false;
        }
      }}
    >
      {offset > 12 && (
        <span
          aria-hidden="true"
          className="absolute -left-6 top-3 text-lg text-[#34836d]"
        >
          ↩
        </span>
      )}
      {children}
      <button
        type="button"
        aria-label="Reply or react to message"
        onClick={openActions}
        className="messenger-message-menu absolute right-0 top-0 grid size-7 place-items-center rounded-full bg-white/90 text-[#52766a] opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <MoreHorizontal size={17} />
      </button>
    </article>
  );
}
export function ChatActionDialog({
  message,
  busy,
  anchor,
  onReply,
  onReact,
  onClose,
}: {
  message: ChatMessage;
  busy: boolean;
  anchor?: DOMRect | null;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>(
    'idle',
  );
  const canCopy =
    !!message.body.trim() &&
    !findChatSticker(message.body) &&
    !message.game_event &&
    !message.reaction_event;
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    const place = () => {
      const liveAnchor =
        document
          .getElementById(`chat-message-${message.id}`)
          ?.querySelector('article')
          ?.getBoundingClientRect() ?? anchor;
      const viewport = window.visualViewport;
      const width = Math.min(360, (viewport?.width ?? innerWidth) - 16);
      node.style.width = width + 'px';
      const height = node.offsetHeight,
        viewHeight = viewport?.height ?? innerHeight;
      const above = (liveAnchor?.top ?? viewHeight / 2) - height - 8;
      const top =
        above >= 8
          ? above
          : Math.min((liveAnchor?.bottom ?? 8) + 8, viewHeight - height - 8);
      node.style.top = Math.max(8, top) + 'px';
      node.style.left =
        Math.max(
          8,
          Math.min(
            liveAnchor?.left ?? 8,
            (viewport?.width ?? innerWidth) - width - 8,
          ),
        ) + 'px';
    };
    const observer = new ResizeObserver(place);
    observer.observe(node);
    window.addEventListener('resize', place);
    window.visualViewport?.addEventListener('resize', place);
    place();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('resize', place);
    };
  }, [anchor, message.id]);
  // Native dialog provides Escape and a focusable Close button; clicks here only dismiss its backdrop.
  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          onClose();
      }}
      aria-label="Message actions"
      className="messenger-dialog messenger-reaction-popup fixed m-0 max-h-[70dvh] overflow-y-auto rounded-2xl border border-[#dbe7df] bg-white p-2 text-[#193c37] shadow-xl backdrop:bg-black/10"
    >
      <div className="flex items-center gap-0.5" aria-label="Quick reactions">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={busy}
            aria-label={`React ${emoji}`}
            onClick={() => onReact(emoji)}
            className="grid h-11 min-w-0 flex-1 place-items-center rounded-full text-[26px] hover:bg-[#edf5ef] disabled:opacity-40"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1 border-t border-[#edf2ed] pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            dialog.current?.close();
            onReply();
          }}
          className="min-h-11 flex-1 rounded-xl text-xs font-bold hover:bg-[#edf5ef]"
        >
          Reply to message
        </button>
        {canCopy && (
          <button
            type="button"
            onClick={async () =>
              setCopyState(
                (await copyChatLink(message.body)) ? 'copied' : 'manual',
              )
            }
            className="min-h-11 flex-1 rounded-xl text-xs font-bold hover:bg-[#edf5ef]"
          >
            Copy text
          </button>
        )}
        <button
          type="button"
          aria-label="Close message actions"
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center rounded-full"
        >
          <X size={17} />
        </button>
      </div>
      {copyState === 'copied' && (
        <output className="mt-1 block text-center text-xs text-[#28775a]">
          Text copied!
        </output>
      )}
      {copyState === 'manual' && (
        <label className="block text-xs">
          Select and copy:
          <textarea
            aria-label="Message text to copy"
            readOnly
            value={message.body}
            onFocus={(event) => event.target.select()}
            className="mt-1 max-h-20 w-full rounded-xl border p-2"
          />
        </label>
      )}
    </dialog>
  );
}
export function ChatAttachmentMenu({
  disabled,
  onPhoto,
  onStickers,
  onGames,
  onDraw,
  onCamera,
}: {
  disabled: boolean;
  onPhoto: () => void;
  onStickers: () => void;
  onGames: () => void;
  onDraw: () => void;
  onCamera: () => void;
}) {
  const details = useRef<HTMLDetailsElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    held = useRef(false);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!details.current?.contains(event.target as Node) && details.current)
        details.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const choices = [
    { label: 'Camera / GIF', icon: Camera, action: onCamera },
    { label: 'Photos', icon: ImagePlus, action: onPhoto },
    { label: 'Draw & send', icon: Pencil, action: onDraw },
    { label: 'Stickers & emoji', icon: Smile, action: onStickers },
    { label: 'Games', icon: Gamepad2, action: onGames },
  ];
  return (
    // Escape closes the native disclosure without trapping focus.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <details
      ref={details}
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && details.current)
          details.current.open = false;
      }}
    >
      <summary
        aria-label="Add to chat"
        aria-disabled={disabled}
        className="messenger-add grid size-12 cursor-pointer list-none place-items-center rounded-full bg-[#edf5f0] text-[#277e69]"
        onPointerDown={() => {
          held.current = false;
          if (!disabled)
            timer.current = setTimeout(() => {
              held.current = true;
              if (details.current) details.current.open = true;
            }, 400);
        }}
        onPointerUp={() => {
          if (timer.current) clearTimeout(timer.current);
        }}
        onPointerCancel={() => {
          if (timer.current) clearTimeout(timer.current);
        }}
        onClick={(event) => {
          if (disabled || held.current) event.preventDefault();
        }}
      >
        <Plus size={23} />
      </summary>
      <div className="absolute bottom-full left-0 z-30 mb-3 w-56 rounded-2xl border border-[#dce9e0] bg-white p-2 shadow-xl">
        {choices.map(({ label, icon: Icon, action }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (details.current) details.current.open = false;
              action();
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold hover:bg-[#edf5ef]"
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </details>
  );
}
export function ChatReportPicker({
  messages,
  onChoose,
  onClose,
}: {
  messages: ChatMessage[];
  onChoose: (message: ChatMessage) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="report-picker-title"
      className="messenger-dialog m-auto max-h-[80dvh] w-[calc(100%-24px)] max-w-md overflow-y-auto rounded-3xl border-0 bg-white p-4 text-[#193c37] backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between">
        <h2 id="report-picker-title" className="font-bold">
          Report chat
        </h2>
        <button
          type="button"
          aria-label="Close report selection"
          onClick={onClose}
          className="grid size-11 place-items-center"
        >
          <X size={18} />
        </button>
      </div>
      <p className="mb-3 text-xs text-[#617b6d]">
        Choose the message you want to report.
      </p>
      {messages.length ? (
        [...messages].reverse().map((message) => (
          <button
            key={message.id}
            type="button"
            onClick={() => onChoose(message)}
            className="mb-2 block w-full rounded-xl bg-[#f0f5f2] p-3 text-left"
          >
            <span className="line-clamp-2 break-words text-sm">
              {message.has_image ? '📷 ' : ''}
              {chatStickerPreview(message.body)}
            </span>
            <time className="text-[10px] text-[#617b6d]">
              {new Date(message.created_at).toLocaleString('en-IN')}
            </time>
          </button>
        ))
      ) : (
        <p className="py-5 text-sm">No incoming messages to report yet.</p>
      )}
    </dialog>
  );
}
export function ChatEmojiShower({
  burst,
}: {
  burst: { id: string; emoji: string } | null;
}) {
  return burst ? (
    <div
      key={burst.id}
      aria-hidden="true"
      className="messenger-shower pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={index}
          style={
            {
              left: `${(index * 37 + 5) % 100}%`,
              animationDelay: `${(index % 7) * 0.13}s`,
              fontSize: `${22 + (index % 4) * 7}px`,
              '--drift': `${(index % 2 ? 1 : -1) * (25 + (index % 5) * 14)}px`,
            } as React.CSSProperties
          }
        >
          {burst.emoji}
        </span>
      ))}
    </div>
  ) : null;
}
