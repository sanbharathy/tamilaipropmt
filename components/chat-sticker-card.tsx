import type { ChatSticker } from '@/lib/chat-stickers';

export function ChatStickerCard({
  sticker,
  small = false,
}: {
  sticker: ChatSticker;
  small?: boolean;
}) {
  return (
    <span
      className={`chat-sticker-card relative block overflow-hidden rounded-[20px] text-center ${small ? 'px-2 py-3' : 'min-w-44 px-5 py-5'}`}
      style={{ backgroundColor: sticker.color, color: sticker.ink }}
    >
      {sticker.photo ? (
        <span className="relative mb-2 block">
          {/* Local licensed assets; native rendering keeps the original photo intact. */}
          {/* oxlint-disable-next-line */}
          <img
            src={sticker.photo}
            alt={`${sticker.actor} portrait`}
            loading="lazy"
            width={240}
            height={180}
            className={`w-full rounded-xl object-cover object-top ${small ? 'h-28' : 'h-44'}`}
          />
          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-0.5 text-[8px] text-white">
            {sticker.actor} · Fan-made
          </span>
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 -top-3 text-5xl font-bold opacity-[.08]"
        >
          ✦
        </span>
      )}
      <span
        aria-hidden="true"
        className={`block -rotate-6 drop-shadow-sm ${small ? 'mb-1 text-3xl' : 'mb-3 text-5xl'}`}
      >
        {sticker.emoji}
      </span>
      <span
        className={`relative block whitespace-pre-line font-bold ${small ? (sticker.kind === 'meme' ? 'text-[9px] leading-5' : 'text-[11px] leading-6') : sticker.kind === 'meme' ? 'max-w-64 text-[12px] leading-7' : 'text-lg leading-8'}`}
      >
        {sticker.ta}
      </span>
      {sticker.kind === 'meme' && !small && (
        <span className="mt-3 block text-[8px] font-bold uppercase tracking-[.18em] opacity-40">
          TAMIL CHAT MOMENTS
        </span>
      )}
      {sticker.credit && (
        <span className="mt-2 block text-[8px] leading-3">
          {sticker.credit}
        </span>
      )}
    </span>
  );
}
