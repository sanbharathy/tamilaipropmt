'use client';
import { useState } from 'react';
import Link from 'next/link';

export function ChatArchiveNotice({
  tamil,
  busy,
  onAccept,
  error,
}: {
  tamil: boolean;
  busy: boolean;
  onAccept: () => void;
  error: string;
}) {
  const [accepted, setAccepted] = useState(false);
  return (
    <main className="grid min-h-dvh place-items-center bg-[#edf4ee] px-5 py-12 text-[#254d3e]">
      <section className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-bold">
          {tamil
            ? 'புதிய chat தனியுரிமை அறிவிப்பு'
            : 'Updated chat privacy notice'}
        </h1>
        <p className="mt-5 text-sm leading-8">
          {tamil
            ? 'புதிய chats முடிந்ததும் அல்லது link காலாவதியானதும் / அழிக்கப்பட்டதும், செய்திகள், சிறிய அளவிலான படங்கள், புனைப்பெயர்கள் மற்றும் நேரங்கள் அடங்கிய PDF பாதுகாப்பு ஆய்வுக்காக 30 நாட்கள் சேமிக்கப்படும். நிர்வாகிகள் மட்டுமே இதைப் பார்க்க முடியும். பின்னர் தானாக நீக்கப்படும். இது end-to-end encrypted chat அல்ல.'
            : 'For new chats, messages, smaller copies of shared images, nicknames and timestamps are saved in an admin-only PDF for security review when a chat ends or its link expires or is destroyed. The archive is retained for 30 days, then automatically removed. This is not end-to-end encrypted chat.'}
        </p>
        <p className="mt-3 text-xs leading-6">
          {tamil
            ? 'பழைய chats-ன் சேமிப்பு விதிகள் மாறாது.'
            : 'Existing conversations keep their original retention policy.'}{' '}
          <Link href="/community-chat/rules" className="underline">
            {tamil ? 'முழு விவரங்கள்' : 'Full details'}
          </Link>
        </p>
        <label className="mt-5 flex items-start gap-3 text-sm leading-7">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1.5 size-4"
          />
          <span>
            {tamil
              ? '30 நாள் பாதுகாப்பு சேமிப்பு அறிவிப்பைப் படித்தேன்.'
              : 'I have read the 30-day security archive notice.'}
          </span>
        </label>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy || !accepted}
          onClick={onAccept}
          className="mt-6 min-h-12 w-full rounded-xl bg-[#225343] px-5 font-bold text-white disabled:opacity-40"
        >
          {tamil ? 'தொடரவும்' : 'Continue'}
        </button>
        <Link href="/" className="mt-4 block text-center text-sm underline">
          {tamil ? 'வெளியேறவும்' : 'Leave chat'}
        </Link>
      </section>
    </main>
  );
}
