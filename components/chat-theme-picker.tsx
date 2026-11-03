'use client';
import { useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
export const chatThemes = [
  {
    id: 'mint',
    name: 'Mint',
    background: '#edf3ee',
    bubble: '#d9f4e2',
    foreground: '#193c37',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    background: '#e8f2fb',
    bubble: '#cee8ff',
    foreground: '#193c37',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    background: '#f0edf8',
    bubble: '#e4dafb',
    foreground: '#342c49',
  },
  {
    id: 'rose',
    name: 'Rose',
    background: '#fbecf0',
    bubble: '#f9d9e3',
    foreground: '#49313a',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#101f29',
    bubble: '#24514e',
    foreground: '#e3f1ed',
  },
] as const;
export type ChatTheme = (typeof chatThemes)[number]['id'];
export function ChatThemePicker({
  theme,
  onChange,
  onClose,
}: {
  theme: ChatTheme;
  onChange: (value: ChatTheme) => void;
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
      aria-labelledby="chat-theme-title"
      className="messenger-dialog m-auto w-[calc(100%-24px)] max-w-sm rounded-3xl border-0 bg-white p-4 text-[#193c37] backdrop:bg-black/40"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 id="chat-theme-title" className="font-bold">
          Chat theme
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close themes"
          className="grid size-11 place-items-center"
        >
          <X size={18} />
        </button>
      </div>
      <p className="mb-3 text-xs text-[#617b6d]">
        Your look, on this device. Your friend’s theme stays their choice.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {chatThemes.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-pressed={theme === choice.id}
            onClick={() => onChange(choice.id)}
            className={`overflow-hidden rounded-2xl border-2 text-left ${theme === choice.id ? 'border-[#298969]' : 'border-transparent'}`}
          >
            <span
              style={{
                background: choice.background,
                color: choice.foreground,
              }}
              className="flex h-20 flex-col justify-center gap-2 px-3"
            >
              <span className="h-3 w-14 rounded-full bg-white/60" />
              <span
                style={{ background: choice.bubble }}
                className="ml-auto h-4 w-20 rounded-full"
              />
            </span>
            <span className="flex items-center justify-between bg-[#f0f5f2] px-3 py-2 text-xs font-bold">
              {choice.name}
              {theme === choice.id && <Check size={15} />}
            </span>
          </button>
        ))}
      </div>
    </dialog>
  );
}
