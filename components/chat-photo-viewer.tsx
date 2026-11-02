'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ImageOff, X, ZoomIn, ZoomOut } from 'lucide-react';

export function ChatPhotoViewer({
  messageId,
  tamil,
  onClose,
}: {
  messageId: string;
  tamil: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = `/api/chat/images/${messageId}`;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="photo-viewer-title"
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-[#0a1716] p-0 text-white backdrop:bg-black/85"
    >
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#112421] px-4 py-3 sm:px-6">
          <div>
            <h2 id="photo-viewer-title" className="text-sm font-bold">
              {tamil ? 'பகிரப்பட்ட படம்' : 'Shared picture'}
            </h2>
            <p className="mt-1 text-[11px] text-white/55">
              {tamil
                ? 'Chat முடிந்ததும் படம் அழிக்கப்படும்'
                : 'Available until this chat ends'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={failed}
              onClick={() => setZoom(!zoom)}
              aria-label={zoom ? 'Zoom out' : 'Zoom in'}
              className="grid size-11 place-items-center rounded-full bg-white/10 disabled:opacity-40"
            >
              {zoom ? <ZoomOut size={19} /> : <ZoomIn size={19} />}
            </button>
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open original picture in a new tab"
              className="grid size-11 place-items-center rounded-full bg-white/10"
            >
              <ArrowUpRight size={19} />
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close picture viewer"
              className="grid size-11 place-items-center rounded-full bg-white text-[#112421]"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="grid min-h-0 flex-1 overflow-auto p-3 sm:p-6">
          {failed ? (
            <div role="alert" className="m-auto max-w-xs text-center">
              <ImageOff className="mx-auto mb-4 size-10 text-white/50" />
              <p className="text-sm leading-7">
                {tamil
                  ? 'இந்த படம் அழிக்கப்பட்டது அல்லது chat முடிந்துவிட்டது.'
                  : 'This picture has been cleared or the chat has ended.'}
              </p>
            </div>
          ) : (
            // Keep private pictures off the public image optimizer and its cache.
            // oxlint-disable-next-line
            <img
              src={source}
              alt="Shared attachment, expanded view"
              onError={() => setFailed(true)}
              referrerPolicy="no-referrer"
              className={
                zoom
                  ? 'm-auto max-w-none w-[max(100%,1400px)]'
                  : 'm-auto max-h-[calc(100dvh-120px)] max-w-full rounded-lg object-contain'
              }
            />
          )}
        </div>
      </div>
    </dialog>
  );
}
