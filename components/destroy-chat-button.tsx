'use client';

import { useEffect, useRef, useState } from 'react';

export function DestroyChatButton({
  roomId,
  tamil,
  onDestroyed,
  disabled = false,
  kind = 'link',
  className,
}: {
  roomId: string;
  tamil: boolean;
  onDestroyed: () => Promise<void>;
  disabled?: boolean;
  kind?: 'link' | 'chat';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const label =
    kind === 'link'
      ? tamil
        ? 'Link-ஐ அழி'
        : 'Destroy link'
      : tamil
        ? 'Chat-ஐ அழி'
        : 'Destroy chat';
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  async function destroy() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'destroy', roomId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? 'Unable to destroy the invitation.');
      setOpen(false);
      await onDestroyed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => {
          setError('');
          setOpen(true);
        }}
        className={
          className ??
          'min-h-10 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-800 disabled:opacity-50'
        }
      >
        {label}
      </button>
      {open && (
        <dialog
          ref={dialog}
          onCancel={(event) => {
            if (busy) event.preventDefault();
            else setOpen(false);
          }}
          aria-labelledby={`destroy-title-${roomId}`}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border-0 bg-white p-6 text-[#18362f] backdrop:bg-black/50"
        >
          <h2 id={`destroy-title-${roomId}`} className="text-lg font-bold">
            {tamil
              ? 'இந்த அழைப்பையும் chat-ஐயும் அழிக்கவா?'
              : 'Destroy this invitation and chat?'}
          </h2>
          <p className="mt-3 text-sm leading-7">
            {tamil
              ? 'பகிர்ந்த link உடனடியாக செயலிழக்கும். உரையாடல் முடிவடையும்; பகிர்ந்த படங்கள் அழிக்கப்படும். மீண்டும் பேச புதிய chat link உருவாக்க வேண்டும்.'
              : 'The shared link will stop working immediately. This conversation will end and shared images will be cleared. You will need a new chat link to start again.'}
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void destroy()}
              className="min-h-11 rounded-xl bg-red-800 px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy
                ? tamil
                  ? 'அழிக்கிறது…'
                  : 'Destroying…'
                : tamil
                  ? 'ஆம், அழிக்கவும்'
                  : 'Yes, destroy'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl border px-4 text-sm font-bold"
            >
              {tamil ? 'ரத்து' : 'Cancel'}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
