'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Copy,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Send,
  X,
} from 'lucide-react';
import type { ChatMessage, ChatState } from '@/lib/chat-types';

const blank: ChatState = {
  me: null,
  rooms: [],
  room: null,
  people: [],
  messages: [],
};
function ChatImage({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="p-3 text-xs">Image cleared or unavailable.</p>
  ) : (
    // Authenticated private images must bypass the public Next.js image optimizer.
    // oxlint-disable-next-line
    <img
      src={`/api/chat/images/${id}`}
      alt="Shared attachment"
      width={1200}
      height={1200}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="max-h-80 w-auto max-w-full rounded-xl object-contain"
    />
  );
}

export function PrivateChat({ roomId }: { roomId: string }) {
  const [state, setState] = useState<ChatState>(blank);
  const [tamil, setTamil] = useState(true);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [nickname, setNickname] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [invitation, setInvitation] = useState<{
    hostName: string;
    own: boolean;
  } | null>(null);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<'end' | 'block' | null>(null);
  const [report, setReport] = useState<ChatMessage | null>(null);
  const [reason, setReason] = useState('');
  const inviteRef = useRef('');
  const version = useRef(0);
  const polling = useRef(false);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const reportDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const me = state.me;
  const meId = me?.id;
  const room = state.room;
  const status = room?.status;
  const txt = (ta: string, en: string) => (tamil ? ta : en);

  const load = useCallback(async () => {
    const current = ++version.current;
    let response = await fetch(`/api/chat?room=${roomId}`, {
      cache: 'no-store',
    });
    let data = await response.json();
    let absent = false;
    if (response.status === 404) {
      absent = true;
      response = await fetch('/api/chat', { cache: 'no-store' });
      data = await response.json();
    }
    if (current !== version.current) return;
    if (!response.ok)
      throw new Error(data.error ?? 'Unable to load this conversation.');
    setState({
      ...data,
      rooms: [],
      people: [],
      ...(absent ? { room: null, messages: [] } : {}),
    });
    setMissing(absent);
    setConnected(true);
    setReady(true);
    if (data.room?.status === 'active' && inviteRef.current) {
      inviteRef.current = '';
      setInviteToken('');
      setInvitation(null);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [roomId]);
  useEffect(() => {
    const secret =
      new URLSearchParams(window.location.hash.slice(1)).get('invite') ?? '';
    inviteRef.current = secret;
    // Hydrate the external invitation fragment, never put it in a server URL.
    // oxlint-disable-next-line
    setInviteToken(secret);
    let mounted = true;
    const sync = () =>
      load().catch((err) => {
        if (mounted) {
          setError(err.message);
          setConnected(false);
          setReady(true);
        }
      });
    void sync();
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible' || polling.current) return;
      polling.current = true;
      try {
        await sync();
      } finally {
        polling.current = false;
      }
    }, 4000);
    return () => {
      mounted = false;
      // This is a request-generation counter, not a DOM ref needing a snapshot.
      // oxlint-disable-next-line
      version.current++;
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!inviteToken || !meId || status === 'active') return;
    let cancelled = false;
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', invite: inviteToken, roomId }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || data.roomId !== roomId)
          throw new Error(
            data.error ?? 'This invitation is for a different conversation.',
          );
        if (!cancelled)
          setInvitation({ hostName: data.hostName, own: data.own });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setInvitation(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken, meId, roomId, status]);
  useEffect(() => {
    if (!image) {
      // Clear the preview when its external object URL is released.
      // oxlint-disable-next-line
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(image);
    // Keep the displayed preview in sync with its browser-managed object URL.
    // oxlint-disable-next-line
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  useEffect(() => {
    if (status !== 'active') {
      // Drop any unsent local file as soon as the chat ends.
      // oxlint-disable-next-line
      setImage(null);
    }
  }, [status]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [state.messages.length]);
  useEffect(() => {
    if (confirm) confirmDialog.current?.showModal();
    if (report) reportDialog.current?.showModal();
  }, [confirm, report]);

  async function act(payload: Record<string, unknown>, after?: () => void) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, roomId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Please retry.');
      after?.();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  }
  async function send(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (busy || status !== 'active' || (!draft.trim() && !image)) return;
    if (!image) {
      await act(
        { action: 'send', text: draft, clientId: crypto.randomUUID() },
        () => setDraft(''),
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.set('image', image);
      form.set('roomId', roomId);
      form.set('clientId', crypto.randomUUID());
      form.set('caption', draft);
      const response = await fetch('/api/chat/images', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? 'Image could not be sent.');
      setImage(null);
      setDraft('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image could not be sent.');
    } finally {
      setBusy(false);
    }
  }
  function chooseImage(file: File | undefined) {
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError(
        txt(
          '2 MB-க்குள் JPG, PNG அல்லது WebP படத்தைத் தேர்ந்தெடுக்கவும்.',
          'Choose a JPG, PNG or WebP image under 2 MB.',
        ),
      );
      return;
    }
    setError('');
    setImage(file);
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/chat/${roomId}#invite=${inviteToken}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Select the invitation link and copy it manually.');
    }
  }
  const incoming =
    room?.status === 'pending' &&
    room.guest_id === meId &&
    room.source === 'directory';
  const canAccept = invitation && !invitation.own && !room;

  return (
    <main className="flex h-dvh min-h-[400px] flex-col bg-[#f4f7f1] text-[#18362f]">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#dbe5de] bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/community-chat"
            aria-label="Back to chats"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-[#dbe5de]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">
              {room?.peer_name ?? txt('தனிப்பட்ட உரையாடல்', 'Private conversation')}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#60776c]">
              <LockKeyhole size={12} aria-hidden="true" />
              {status === 'active'
                ? txt('இருவர் மட்டும்', 'Two participants')
                : txt('Private chat', 'Private chat')}
              {me ? ` · ${me.name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTamil(!tamil)}
            className="min-h-10 rounded-xl border border-[#dbe5de] px-3 text-xs font-semibold"
          >
            {tamil ? 'EN' : 'தமிழ்'}
          </button>
          {room && status !== 'ended' && status !== 'declined' && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirm('end')}
                className="min-h-10 rounded-xl border border-[#dbe5de] px-3 text-xs font-bold"
              >
                {txt('முடி', 'End')}
              </button>
              {room.peer_id && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm('block')}
                  className="min-h-10 rounded-xl px-2 text-xs font-semibold text-red-800"
                >
                  Block
                </button>
              )}
            </>
          )}
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <output className="shrink-0 bg-[#e4efdf] px-4 py-3 text-sm">
          {notice}
        </output>
      )}
      {!connected && (
        <output className="shrink-0 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          {txt('மீண்டும் இணைக்கிறது…', 'Reconnecting…')}
        </output>
      )}

      {!ready ? (
        <div className="grid flex-1 place-items-center">
          <LoaderCircle
            className="animate-spin"
            aria-label="Loading conversation"
          />
        </div>
      ) : !me ? (
        <div className="grid flex-1 overflow-y-auto p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void act({ action: 'join', name: nickname, accepted: agreed });
            }}
            className="m-auto w-full max-w-sm rounded-3xl border border-[#dbe5de] bg-white p-6"
          >
            <h2 className="text-xl font-bold leading-9">
              {txt('இந்த chat-ல் இணையுங்கள்', 'Join this private chat')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#60776c]">
              {txt(
                'ஒரு புனைப்பெயரைத் தேர்ந்தெடுக்கவும். அடுத்த படியில் அழைப்பை ஏற்றுக்கொள்ளலாம்.',
                'Choose a nickname. You can review and accept the invitation next.',
              )}
            </p>
            <label className="mt-5 block text-sm font-bold">
              {txt('புனைப்பெயர்', 'Nickname')}
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                minLength={2}
                maxLength={24}
                required
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#cbd9c7] px-3 font-normal"
              />
            </label>
            <label className="mt-5 flex gap-3 text-xs leading-6">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-1 size-4 shrink-0 accent-[#225343]"
              />
              <span>
                {txt(
                  'மரியாதையாகப் பேச ஒப்புக்கொள்கிறேன்.',
                  'I agree to chat respectfully.',
                )}{' '}
                <Link href="/community-chat/rules" className="underline">
                  {txt('Chat விதிகள்', 'Chat rules')}
                </Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={busy || !agreed}
              className="mt-5 min-h-12 w-full rounded-xl bg-[#225343] font-bold text-white disabled:opacity-50"
            >
              {busy ? txt('இணைகிறது…', 'Joining…') : txt('தொடரவும்', 'Continue')}
            </button>
          </form>
        </div>
      ) : status !== 'active' ? (
        <div className="grid flex-1 overflow-y-auto p-5">
          <section className="m-auto w-full max-w-md text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e2ecd9]">
              <LockKeyhole size={27} aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-bold leading-9">
              {canAccept
                ? `${invitation.hostName} ${txt('உங்களை அழைத்துள்ளார்', 'invited you to chat')}`
                : incoming
                  ? `${room.peer_name} ${txt('உங்களுடன் பேச விரும்புகிறார்', 'would like to chat')}`
                  : status === 'ended'
                    ? txt('உரையாடல் முடிந்தது', 'Conversation ended')
                    : status === 'declined'
                      ? txt('அழைப்பு மறுக்கப்பட்டது', 'Invitation declined')
                      : missing
                        ? txt(
                            'செல்லுபடியாகும் அழைப்பு தேவை',
                            'An invitation is required',
                          )
                        : txt(
                            'நண்பருக்காகக் காத்திருக்கிறது',
                            'Waiting for your friend',
                          )}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#60776c]">
              {status === 'ended' || status === 'declined'
                ? txt(
                    'இந்த chat-ல் பகிரப்பட்ட படங்கள் அழிக்கப்பட்டன.',
                    'Images shared in this chat have been cleared.',
                  )
                : txt(
                    'இருவரும் ஒப்புக்கொண்ட பிறகே படங்களையும் செய்திகளையும் பகிர முடியும்.',
                    'Messages and images can be shared only after both people agree.',
                  )}
            </p>
            {(canAccept || incoming) && (
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void act(
                      canAccept
                        ? { action: 'accept-invite', invite: inviteToken }
                        : { action: 'accept' },
                      () => {
                        inviteRef.current = '';
                        setInviteToken('');
                        setInvitation(null);
                        window.history.replaceState(
                          null,
                          '',
                          window.location.pathname,
                        );
                      },
                    )
                  }
                  className="min-h-12 rounded-xl bg-[#225343] px-5 text-sm font-bold text-white"
                >
                  {txt('ஏற்று & பேசு', 'Accept & chat')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (incoming) void act({ action: 'decline' });
                    else {
                      setInvitation(null);
                      inviteRef.current = '';
                      setInviteToken('');
                      setMissing(true);
                      window.history.replaceState(
                        null,
                        '',
                        window.location.pathname,
                      );
                    }
                  }}
                  className="min-h-12 rounded-xl border border-[#cbd9c7] px-5 text-sm font-bold"
                >
                  {txt('மறுக்க', 'Decline')}
                </button>
              </div>
            )}
            {room?.host_id === meId && status === 'pending' && inviteToken && (
              <div className="mt-6 rounded-2xl border border-[#d0ddc6] bg-white p-4">
                <p className="mb-3 text-sm font-semibold">
                  {txt(
                    'இந்த link-ஐ நண்பருக்கு அனுப்புங்கள்',
                    'Send this link to your friend',
                  )}
                </p>
                <input
                  readOnly
                  aria-label="Private invitation link"
                  onFocus={(e) => e.target.select()}
                  value={
                    typeof window === 'undefined'
                      ? ''
                      : `${window.location.origin}/chat/${roomId}#invite=${inviteToken}`
                  }
                  className="min-h-11 w-full rounded-xl border border-[#dbe5de] px-3 text-xs"
                />
                <button
                  type="button"
                  onClick={copyInvite}
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#225343] px-5 text-sm font-bold text-white"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}{' '}
                  {copied
                    ? txt('நகலெடுத்தது', 'Copied')
                    : txt('Link நகலெடு', 'Copy link')}
                </button>
              </div>
            )}
            {(status === 'ended' || status === 'declined' || missing) &&
              !canAccept && (
                <Link
                  href="/community-chat"
                  className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-[#cbd9c7] px-5 text-sm font-semibold"
                >
                  {txt('Chats-க்குத் திரும்பு', 'Back to chats')}
                </Link>
              )}
          </section>
        </div>
      ) : (
        <>
          <div
            role="log"
            aria-label="Conversation messages"
            aria-live="polite"
            aria-relevant="additions text"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:px-8 sm:py-6"
          >
            {!state.messages.length && (
              <p className="py-8 text-center text-sm text-[#60776c]">
                {txt(
                  'வணக்கம் சொல்லுங்கள் அல்லது ஒரு படத்தைப் பகிருங்கள்.',
                  'Say hello or share an image.',
                )}
              </p>
            )}
            {state.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === meId ? 'justify-end' : 'justify-start'}`}
              >
                <article className="max-w-[88%] sm:max-w-[70%]">
                  <div
                    className={`overflow-hidden rounded-2xl p-2 ${message.sender_id === meId ? 'rounded-br-sm bg-[#225343] text-white' : 'rounded-bl-sm border border-[#dbe5de] bg-white'}`}
                  >
                    {message.has_image && <ChatImage id={message.id} />}
                    <p className="whitespace-pre-wrap break-words px-2 py-1 text-sm leading-7 [overflow-wrap:anywhere]">
                      {message.body}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-[#60776c]">
                    <time dateTime={message.created_at}>
                      {new Date(message.created_at).toLocaleTimeString(
                        tamil ? 'ta-IN' : 'en-IN',
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                    </time>
                    {message.sender_id !== meId && (
                      <button
                        type="button"
                        onClick={() => {
                          setReport(message);
                          setReason('');
                        }}
                        className="min-h-8 underline"
                      >
                        {txt('புகாரளி', 'Report')}
                      </button>
                    )}
                  </div>
                </article>
              </div>
            ))}
            <div ref={bottom} />
          </div>
          <form
            onSubmit={send}
            className="shrink-0 border-t border-[#dbe5de] bg-white px-3 py-3 sm:px-6"
          >
            {preview && (
              <div className="mb-3 flex items-start gap-3 rounded-xl bg-[#f0f5eb] p-3">
                {/* A local object URL preview; it is revoked on remove, send, chat end or unmount. */}
                {/* oxlint-disable-next-line */}
                <img
                  src={preview}
                  alt="Selected attachment preview"
                  className="max-h-32 max-w-40 rounded-lg object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {txt('பகிரத் தயாராக உள்ளது', 'Ready to share')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[#60776c]">
                    {txt(
                      'Chat முடிந்ததும் படம் அழிக்கப்படும்.',
                      'Cleared when the chat ends.',
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  aria-label="Remove selected image"
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-[#cbd9c7]"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose image to share"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  chooseImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={busy || !connected}
                onClick={() => fileInput.current?.click()}
                aria-label={txt('படத்தைச் சேர்', 'Attach image')}
                className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#cbd9c7] disabled:opacity-40"
              >
                <ImagePlus size={20} />
              </button>
              <label htmlFor="private-message" className="sr-only">
                {txt('உங்கள் செய்தி', 'Your message')}
              </label>
              <textarea
                id="private-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                maxLength={1200}
                disabled={busy}
                placeholder={
                  image
                    ? txt('விருப்பமான விளக்கம்…', 'Add a caption…')
                    : txt('செய்தியை எழுதுங்கள்…', 'Write a message…')
                }
                className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-[#cbd9c7] px-3 py-3 text-sm leading-6"
              />
              <button
                type="submit"
                disabled={busy || (!draft.trim() && !image) || !connected}
                aria-label={txt('அனுப்பு', 'Send')}
                className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#225343] text-white disabled:opacity-40"
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] leading-5 text-[#60776c]">
              {txt(
                'JPG / PNG / WebP · 2 MB வரை · Chat முடிந்ததும் படங்கள் அழிக்கப்படும்',
                'JPG / PNG / WebP · Up to 2 MB · Images cleared when chat ends',
              )}
            </p>
          </form>
        </>
      )}
      {confirm && (
        <dialog
          ref={confirmDialog}
          onCancel={() => setConfirm(null)}
          aria-labelledby="end-chat-title"
          className="m-auto max-w-sm rounded-3xl border-0 bg-white p-6 text-[#18362f] backdrop:bg-black/50"
        >
          <h2 id="end-chat-title" className="text-lg font-bold">
            {confirm === 'block'
              ? txt('Block செய்து chat-ஐ முடிக்கவா?', 'Block and end this chat?')
              : txt('Chat-ஐ முடிக்கவா?', 'End this chat?')}
          </h2>
          <p className="mt-3 text-sm leading-7">
            {txt(
              'பகிரப்பட்ட அனைத்துப் படங்களும் உடனடியாக அழிக்கப்படும். இருவரும் இனி இந்த chat-ல் செய்தி அனுப்ப முடியாது.',
              'All shared images will be cleared immediately. Neither person can send further messages in this conversation.',
            )}
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void act({ action: confirm }, () => {
                  setConfirm(null);
                  setImage(null);
                  setDraft('');
                })
              }
              className="min-h-11 rounded-xl bg-[#225343] px-4 text-sm font-bold text-white"
            >
              {txt('ஆம், முடிக்கவும்', 'Yes, end chat')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirm(null)}
              className="min-h-11 rounded-xl border px-4 text-sm font-bold"
            >
              {txt('ரத்து', 'Cancel')}
            </button>
          </div>
        </dialog>
      )}
      {report && (
        <dialog
          ref={reportDialog}
          onCancel={() => setReport(null)}
          aria-labelledby="report-chat-title"
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border-0 bg-white p-6 text-[#18362f]"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void act(
                { action: 'report', messageId: report.id, reason },
                () => {
                  setReport(null);
                  setNotice(txt('புகார் அனுப்பப்பட்டது.', 'Report submitted.'));
                },
              );
            }}
          >
            <h2 id="report-chat-title" className="text-lg font-bold">
              {txt('புகாரளிக்க', 'Report message')}
            </h2>
            <p className="mt-3 text-xs leading-6">
              {txt(
                'Chat செயல்பாட்டில் இருக்கும்போது moderator இந்தச் செய்தியையும் படத்தையும் பார்க்கலாம். முடிந்த பிறகு படம் இருக்காது.',
                'A moderator can review this message and its image while the chat is active. The image is cleared when the chat ends.',
              )}
            </p>
            <label className="mt-4 block text-sm font-semibold">
              {txt('காரணம்', 'Reason')}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={3}
                maxLength={300}
                required
                rows={3}
                className="mt-2 w-full rounded-xl border p-3 font-normal"
              />
            </label>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={busy}
                className="min-h-11 rounded-xl bg-[#225343] px-4 text-sm font-bold text-white"
              >
                {txt('அனுப்பு', 'Submit')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setReport(null)}
                className="min-h-11 rounded-xl border px-4 text-sm font-bold"
              >
                {txt('ரத்து', 'Cancel')}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </main>
  );
}
