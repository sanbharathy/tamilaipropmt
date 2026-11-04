'use client';
import { useState } from 'react';
import { Gamepad2, X } from 'lucide-react';
import { ChatStickerCard } from './chat-sticker-card';
import {
  chatStickers,
  tamilStickerPacks,
  type ChatSticker,
} from '@/lib/chat-stickers';
export function ChatStickerPicker({
  busy,
  tamil,
  onSend,
  onClose,
  onEmoji,
  onGames,
}: {
  busy: boolean;
  tamil: boolean;
  onSend: (sticker: ChatSticker) => void;
  onClose: () => void;
  onEmoji: (emoji: string) => void;
  onGames: () => void;
}) {
  const [tab, setTab] = useState<'packs' | 'sticker' | 'meme' | 'comedy'>(
      'packs',
    ),
    [pack, setPack] = useState(tamilStickerPacks[0].id);
  const selected =
      tamilStickerPacks.find((item) => item.id === pack) ??
      tamilStickerPacks[0],
    stickers =
      tab === 'packs'
        ? selected.stickers
        : chatStickers.filter((sticker) => sticker.kind === tab);
  return (
    <section
      aria-label="Tamil stickers and memes"
      className="mb-2 flex max-h-[52dvh] flex-col overflow-hidden rounded-[22px] border border-[#dce9e0] bg-[#fbfdfb] text-[#244b42] shadow-sm"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-[#e9efea] px-2 py-1">
        <div className="flex min-w-0 flex-1 overflow-x-auto">
          {(
            [
              { id: 'packs', name: tamil ? 'தமிழ் Packs' : 'Tamil packs' },
              { id: 'sticker', name: 'Originals' },
              { id: 'meme', name: 'Memes' },
              { id: 'comedy', name: 'Comedy' },
            ] as const
          ).map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={tab === choice.id}
              onClick={() => setTab(choice.id)}
              className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${tab === choice.id ? 'bg-[#dfeee5] text-[#28715b]' : 'text-[#617b6d]'}`}
            >
              {choice.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Choose a game"
          onClick={onGames}
          className="grid size-10 shrink-0 place-items-center rounded-full"
        >
          <Gamepad2 size={18} />
        </button>
        <button
          type="button"
          aria-label="Close stickers"
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center rounded-full"
        >
          <X size={18} />
        </button>
      </div>
      {tab === 'packs' && (
        <div className="flex shrink-0 items-center gap-2 px-3 py-2">
          <label htmlFor="tamil-sticker-pack" className="text-xs font-semibold">
            Pack
          </label>
          <select
            id="tamil-sticker-pack"
            value={pack}
            onChange={(event) => setPack(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-xl border border-[#dce9e0] bg-white px-2 text-base"
          >
            {tamilStickerPacks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.stickers.length})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex shrink-0 justify-center gap-1 border-b border-[#e9efea] py-1">
        {['😂', '😘', '🔥', '❤️', '🪔', '😎'].map((emoji) => (
          <button
            key={emoji}
            type="button"
            disabled={busy}
            aria-label={`Add ${emoji}`}
            onClick={() => onEmoji(emoji)}
            className="grid size-9 place-items-center rounded-full text-2xl hover:bg-[#edf4ef] disabled:opacity-40"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div
        key={tab === 'packs' ? pack : tab}
        aria-label={
          tab === 'packs'
            ? `${selected.name} stickers`
            : 'Original reaction cards'
        }
        className={`grid min-h-0 overflow-y-auto overscroll-contain p-2 ${tab === 'packs' ? 'grid-cols-3 gap-1 sm:grid-cols-5' : 'grid-cols-2 gap-2 sm:grid-cols-3'}`}
      >
        {stickers.map((sticker) => (
          <button
            key={sticker.id}
            type="button"
            disabled={busy}
            onClick={() => onSend(sticker)}
            aria-label={`Send ${sticker.en}`}
            title={sticker.en}
            className="min-w-0 rounded-xl border border-transparent transition hover:border-[#9ac9ae] hover:bg-[#eaf4ed] focus-visible:outline-2 focus-visible:outline-[#23856a] disabled:opacity-40"
          >
            <ChatStickerCard sticker={sticker} small />
          </button>
        ))}
      </div>
      <p className="shrink-0 px-3 py-1 text-[10px] text-[#617b6d]">
        {tamil ? 'ஒரு sticker-ஐத் தொட்டால் அனுப்பப்படும்' : 'Tap a sticker to send'} ·{' '}
        {stickers.length} {tab === 'packs' ? 'in this pack' : 'reactions'}
      </p>
    </section>
  );
}
