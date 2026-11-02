'use client';
import { useState } from 'react';
import Link from 'next/link';

export function ChatArchiveNotice({
  busy,
  onAccept,
  error,
}: {
  busy: boolean;
  onAccept: () => void;
  error: string;
}) {
  const [accepted, setAccepted] = useState(false);
  return (
    <main
      lang="en"
      translate="no"
      className="grid min-h-dvh place-items-center bg-[#edf4ee] px-5 py-12 text-[#254d3e]"
    >
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">Updated chat privacy notice</h1>
        <p className="mt-4 text-[13px] leading-6">
          For new chats, messages, smaller copies of shared images, nicknames
          and timestamps are saved in an admin-only PDF for security review when
          a chat ends or its link expires or is destroyed. The archive is
          retained for 30 days, then automatically removed. This is not
          end-to-end encrypted chat.
        </p>
        <p className="mt-3 text-xs leading-5">
          Existing conversations keep their original retention policy.{' '}
          <Link href="/community-chat/rules" className="underline">
            Full details
          </Link>
        </p>
        <label className="mt-4 flex items-start gap-3 text-[8px] leading-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 size-4 shrink-0"
          />
          <span>I have read the 30-day security archive notice.</span>
        </label>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-800">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy || !accepted}
          onClick={onAccept}
          className="mt-5 min-h-12 w-full rounded-xl bg-[#225343] px-5 text-sm font-bold text-white disabled:opacity-40"
        >
          Continue
        </button>
        <Link href="/" className="mt-4 block text-center text-xs underline">
          Leave chat
        </Link>
      </section>
    </main>
  );
}
