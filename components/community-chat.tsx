'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  chatTopics,
  type ChatMessage,
  type ChatRoom,
  type ChatState,
} from '@/lib/chat-types';

const empty: ChatState = {
  me: null,
  rooms: [],
  people: [],
  messages: [],
  room: null,
};
type Invite = { hostName: string; roomId: string; own: boolean };

export function CommunityChat() {
  const [tamil, setTamil] = useState(true);
  const [state, setState] = useState<ChatState>(empty);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [nickname, setNickname] = useState('');
  const [rules, setRules] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(true);
  const [report, setReport] = useState<ChatMessage | null>(null);
  const [reason, setReason] = useState('');
  const [confirmAction, setConfirmAction] = useState<
    'block' | 'end' | 'leave' | null
  >(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const reportDialog = useRef<HTMLDialogElement>(null);
  const chatPanel = useRef<HTMLElement>(null);
  const lastMessage = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);
  const activeRoom = useRef<string | null>(null);
  const polling = useRef(false);
  const me = state.me;
  const meId = me?.id;
  const room = state.room;
  const txt = (ta: string, en: string) => (tamil ? ta : en);

  const refresh = useCallback(
    async (selected: string | null, signal?: AbortSignal) => {
      const id = ++requestId.current;
      const response = await fetch(
        `/api/chat${selected ? `?room=${encodeURIComponent(selected)}` : ''}`,
        { cache: 'no-store', signal },
      );
      const data = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) {
        if (response.status === 401) {
          setState(empty);
          setRoomId(null);
        }
        if (response.status === 404 && selected) {
          setRoomId(null);
          setNotice(data.error);
          return;
        }
        throw new Error(data.error || 'Unable to load chat.');
      }
      setState(data);
      setConnected(true);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    activeRoom.current = roomId;
  }, [roomId]);
  useEffect(() => {
    if (roomId && window.matchMedia('(max-width: 1023px)').matches)
      chatPanel.current?.scrollIntoView({ block: 'start' });
  }, [roomId]);
  useEffect(() => {
    const controller = new AbortController();
    // Network state is applied asynchronously after the request completes.
    // oxlint-disable-next-line
    refresh(roomId, controller.signal).catch((err) => {
      if (!controller.signal.aborted) {
        setError(err.message);
        setConnected(false);
        setLoading(false);
      }
    });
    return () => controller.abort();
  }, [refresh, roomId]);
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      'invite',
    );
    // Read the external invitation fragment only after hydration.
    // oxlint-disable-next-line
    if (token) setInviteToken(token);
    if (token)
      void fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve-invite', invite: token }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (response.ok)
            window.location.replace(
              `/chat/${String(data.roomId)}#invite=${encodeURIComponent(token)}`,
            );
        })
        .catch(() =>
          setError('Unable to open the invitation. Please try again.'),
        );
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible' || polling.current) return;
      polling.current = true;
      try {
        await refresh(activeRoom.current);
      } catch {
        setConnected(false);
      } finally {
        polling.current = false;
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    lastMessage.current?.scrollIntoView({ block: 'nearest' });
  }, [state.messages.length, roomId]);
  useEffect(() => {
    if (confirmAction) confirmDialog.current?.showModal();
    if (report) reportDialog.current?.showModal();
  }, [confirmAction, report]);

  async function post(payload: Record<string, unknown>) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Please try again.');
    return data;
  }
  async function perform(
    payload: Record<string, unknown>,
    after?: (data: Record<string, unknown>) => void,
  ) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await post(payload);
      after?.(data);
      await refresh(activeRoom.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!inviteToken || !meId) return;
    let cancelled = false;
    post({ action: 'preview', invite: inviteToken })
      .then((data) => {
        if (!cancelled) setInvite(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setInviteToken('');
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken, meId]); // Only preview after joining; never silently accepts an invite.

  async function createLink() {
    await perform({ action: 'create' }, (data) => {
      window.location.assign(
        `/chat/${String(data.roomId)}#invite=${String(data.invite)}`,
      );
    });
  }
  async function acceptInvite() {
    await perform({ action: 'accept-invite', invite: inviteToken }, (data) => {
      const id = String(data.roomId);
      window.location.assign(`/chat/${id}`);
      setInvite(null);
      setInviteToken('');
      window.history.replaceState(null, '', window.location.pathname);
    });
  }
  async function send(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!draft.trim() || !roomId || busy) return;
    await perform(
      { action: 'send', roomId, text: draft, clientId: crypto.randomUUID() },
      () => setDraft(''),
    );
    // On failure, the draft stays available so the visitor can retry.
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        txt(
          'இணைப்பைத் தேர்ந்தெடுத்து நகலெடுக்கவும்.',
          'Select the invitation link and copy it manually.',
        ),
      );
    }
  }
  function selectRoom(value: ChatRoom) {
    window.location.assign(`/chat/${value.id}`);
  }
  async function confirm() {
    const action = confirmAction;
    if (!action) return;
    await perform({ action, roomId }, () => {
      setConfirmAction(null);
      setShareLink('');
      if (action === 'leave') {
        activeRoom.current = null;
        setRoomId(null);
        setState(empty);
      }
    });
  }
  const requests = state.rooms.filter(
    (r) => r.status === 'pending' && r.guest_id === me?.id,
  );

  return (
    <main className="min-h-screen bg-[#f3f5f3] text-[#18362f]">
      <header className="border-b border-[#dbe5de] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            TamilAI Prompt
          </Link>
          <button
            type="button"
            onClick={() => setTamil(!tamil)}
            className="min-h-11 rounded-full border border-[#cadbd0] px-4 text-sm font-bold"
          >
            {tamil ? 'English' : 'தமிழ்'}
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-[#5c796b]">
              TAMIL CREATOR CONNECTIONS
            </p>
            <h1 className="text-2xl font-bold leading-relaxed sm:text-4xl">
              {txt(
                'ஒரு link. ஒரு நல்ல உரையாடல்.',
                'One link. A good conversation.',
              )}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#60776c]">
              {txt(
                'நண்பருக்கு private link அனுப்புங்கள். அல்லது விருப்பமுள்ள creator-உடன் அனுமதி பெற்று பேசுங்கள்.',
                'Invite a friend with a private link, or connect with a creator who chooses to chat.',
              )}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#e4eee6] px-4 py-2 text-xs font-bold">
            <LockKeyhole size={14} aria-hidden="true" />
            {txt(
              'இருவர் மட்டும் · செய்திகள் & படங்கள்',
              'Two people · Messages & images',
            )}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError('')}
              className="p-2"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <output className="mb-5 block rounded-2xl bg-[#e3ede3] p-4 text-sm">
            {notice}
          </output>
        )}

        {loading ? (
          <div className="grid min-h-80 place-items-center">
            <LoaderCircle className="animate-spin" aria-label="Loading chat" />
          </div>
        ) : !me ? (
          <section className="grid overflow-hidden rounded-[2rem] border border-[#dbe5de] bg-white lg:grid-cols-2">
            <div className="order-2 bg-[#173e35] p-7 lg:order-1 text-[#eef7e7] sm:p-12">
              <span className="mb-8 inline-grid size-16 place-items-center rounded-2xl border border-[#6f9b7a]">
                <MessageCircle size={30} aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-bold leading-relaxed sm:text-3xl">
                {txt(
                  'பேசலாம். உங்கள் விருப்பப்படி.',
                  'A conversation on your terms.',
                )}
              </h2>
              <div className="mt-8 space-y-7">
                {[
                  [
                    Link2,
                    txt('நண்பருக்கு ஒரு அழைப்பு', 'Send a personal invitation'),
                    txt(
                      'இணைப்பைப் பகிருங்கள். நண்பர் ஏற்றால் மட்டுமே chat தொடங்கும்.',
                      'Share a link. Chat starts only when your friend accepts.',
                    ),
                  ],
                  [
                    Users,
                    txt('ஒரே ஆர்வம் உள்ளவர்கள்', 'Find a shared interest'),
                    txt(
                      'Available என்பதை நீங்களே தேர்வு செய்யுங்கள். ஒவ்வொரு chat-க்கும் accept / decline செய்யலாம்.',
                      'Choose to be available. Accept or decline every new chat request.',
                    ),
                  ],
                  [
                    ShieldCheck,
                    txt('கட்டுப்பாடு உங்கள் கையில்', 'You stay in control'),
                    txt(
                      'எப்போது வேண்டுமானாலும் end, block அல்லது report செய்யுங்கள்.',
                      'End, block, or report whenever you need.',
                    ),
                  ],
                ].map(([Icon, title, description]) => {
                  const I = Icon as typeof Link2;
                  return (
                    <div key={String(title)} className="flex gap-4">
                      <I
                        className="mt-1 size-5 shrink-0 text-[#b8d8a0]"
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className="text-sm font-bold">{String(title)}</h3>
                        <p className="mt-2 text-sm leading-7 text-[#bfd0c2]">
                          {String(description)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform({
                  action: 'join',
                  name: nickname,
                  accepted: rules,
                });
              }}
              className="order-1 flex flex-col justify-center p-7 sm:p-12 lg:order-2"
            >
              <p className="text-xs font-bold tracking-widest text-[#62806b]">
                {inviteToken ? 'YOU’RE INVITED' : 'START HERE'}
              </p>
              <h2 className="mt-4 text-2xl font-bold">
                {txt('எந்தப் பெயரில் பேசலாம்?', 'What shall we call you?')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#60776c]">
                {txt(
                  'Email அல்லது phone தேவையில்லை. இந்த browser-ல் 24 மணி நேர guest session உருவாகும்.',
                  'No email or phone required. Your guest session lasts up to 24 hours in this browser.',
                )}
              </p>
              <label className="mt-6 text-sm font-bold">
                {txt('புனைப்பெயர்', 'Nickname')}
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  minLength={2}
                  maxLength={24}
                  required
                  autoComplete="off"
                  placeholder={txt('உதா: தமிழ்Creator', 'e.g. TamilCreator')}
                  className="mt-2 min-h-12 w-full rounded-xl border border-[#bfd0c2] px-4 font-normal outline-offset-4"
                />
              </label>
              <label className="my-6 flex items-start gap-3 text-sm leading-7 text-[#60776c]">
                <input
                  type="checkbox"
                  checked={rules}
                  onChange={(e) => setRules(e.target.checked)}
                  required
                  className="mt-1.5 size-4 shrink-0 accent-[#225343]"
                />
                <span>
                  {txt(
                    'மரியாதையாகப் பேசவும், spam செய்யாமல் இருக்கவும் ஒப்புக்கொள்கிறேன். இது end-to-end encrypted chat அல்ல.',
                    'I agree to be respectful and avoid spam. This chat is not end-to-end encrypted.',
                  )}{' '}
                  <Link
                    href="/community-chat/rules"
                    className="font-bold underline"
                  >
                    {txt('Chat விதிகள் & தனியுரிமை', 'Chat rules & privacy')}
                  </Link>
                </span>
              </label>
              <button
                type="submit"
                disabled={busy || !rules || !connected}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#225343] px-5 font-bold text-white disabled:opacity-50"
              >
                {busy ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} aria-hidden="true" />
                )}
                {txt('Chat-ல் இணையுங்கள்', 'Enter chat')}
              </button>
            </form>
          </section>
        ) : (
          <>
            {invite && (
              <section className="mb-5 rounded-2xl border border-[#b9cfb2] bg-[#e9f2e1] p-5">
                <p className="font-bold">
                  {invite.hostName}{' '}
                  {txt('உங்களை chat-க்கு அழைத்துள்ளார்.', 'invited you to chat.')}
                </p>
                <p className="mt-2 text-sm leading-7">
                  {txt(
                    'ஏற்றுக்கொண்டால் மட்டுமே உரையாடல் தொடங்கும்.',
                    'The conversation starts only after you accept.',
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={acceptInvite}
                    className="min-h-11 rounded-xl bg-[#225343] px-5 text-sm font-bold text-white"
                  >
                    {invite.own
                      ? txt('என் உரையாடலைத் திற', 'Open my conversation')
                      : txt('ஏற்று & பேசு', 'Accept & chat')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setInvite(null);
                      setInviteToken('');
                      window.history.replaceState(
                        null,
                        '',
                        window.location.pathname,
                      );
                    }}
                    className="min-h-11 rounded-xl border border-[#a9bfa3] px-5 text-sm font-bold"
                  >
                    {txt('வேண்டாம்', 'Decline')}
                  </button>
                </div>
              </section>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
              <aside id="chat-controls" className="scroll-mt-4 space-y-4">
                <section className="rounded-3xl border border-[#dbe5de] bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e7eee2] text-lg font-bold">
                      {Array.from(me.name)[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{me.name}</p>
                      <p className="mt-1 text-xs text-[#60776c]">
                        {txt(
                          'Guest · 24 மணி நேரம் வரை',
                          'Guest · Up to 24 hours',
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={createLink}
                    disabled={busy}
                    className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#225343] px-4 text-sm font-bold text-white disabled:opacity-50"
                  >
                    <Link2 size={17} aria-hidden="true" />
                    {txt('Private link உருவாக்கு', 'Create private link')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('leave')}
                    className="mt-3 min-h-11 w-full text-xs font-semibold text-[#60776c]"
                  >
                    {txt(
                      'Guest session-இலிருந்து வெளியேறு',
                      'Leave guest session',
                    )}
                  </button>
                </section>
                <section className="rounded-3xl border border-[#dbe5de] bg-white p-5">
                  <h2 className="mb-3 text-sm font-bold">
                    {txt(
                      'விருப்பமிருந்தால் மட்டும்',
                      'Meet creators, only if you want',
                    )}
                  </h2>
                  <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
                    {txt('பேசத் தயார்', 'Available to chat')}
                    <input
                      type="checkbox"
                      checked={me.available}
                      disabled={busy}
                      onChange={(e) =>
                        void perform({
                          action: 'availability',
                          available: e.target.checked,
                          topic: me.topic,
                        })
                      }
                      className="size-5 accent-[#225343]"
                    />
                  </label>
                  <label className="mt-3 block text-xs font-semibold">
                    {txt('உங்கள் ஆர்வம்', 'Your interest')}
                    <select
                      value={me.topic}
                      disabled={busy}
                      onChange={(e) =>
                        void perform({
                          action: 'availability',
                          available: me.available,
                          topic: e.target.value,
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-[#dbe5de] bg-white px-3 text-sm"
                    >
                      {chatTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {tamil ? topic.ta : topic.en}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="mt-3 text-xs leading-6 text-[#60776c]">
                    {me.available
                      ? txt(
                          'இந்த chat பக்கம் திறந்திருக்கும் போது, இதே ஆர்வத்தைத் தேர்ந்தெடுத்தவர்களுக்கு உங்கள் பெயர் தெரியும்.',
                          'While this chat page is open, people with the same interest can see your nickname.',
                        )
                      : txt(
                          'நீங்கள் மற்றவர்களின் பட்டியலில் தெரிய மாட்டீர்கள். Private link-ஐ பயன்படுத்தலாம்.',
                          'You are hidden from the people list. Private invitation links still work.',
                        )}
                  </p>
                  {me.available && (
                    <div className="mt-4 space-y-2">
                      {state.people.length ? (
                        state.people.map((person) => (
                          <div
                            key={person.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-[#f3f6f0] p-3"
                          >
                            <span className="min-w-0 truncate text-sm font-bold">
                              {person.name}
                            </span>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void perform(
                                  { action: 'request', peer: person.id },
                                  (data) => {
                                    window.location.assign(
                                      `/chat/${String(data.roomId)}`,
                                    );
                                  },
                                )
                              }
                              className="min-h-11 shrink-0 rounded-lg border border-[#c7d6bf] px-3 text-xs font-bold"
                            >
                              {txt('அழை', 'Request')}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-xl bg-[#f3f6f0] p-3 text-xs leading-6">
                          {txt(
                            'இப்போது யாரும் கிடைக்கவில்லை. நண்பருக்கு private link அனுப்பலாம்.',
                            'No one is available in this interest right now. Invite a friend with a private link.',
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </section>
                {requests.length > 0 && (
                  <section className="rounded-3xl border border-[#c8d8bc] bg-[#e9f2e1] p-5">
                    <h2 className="text-sm font-bold">
                      {txt('உங்களுக்கு வந்த அழைப்புகள்', 'Your invitations')} (
                      {requests.length})
                    </h2>
                    <div className="mt-3 space-y-4">
                      {requests.map((request) => (
                        <div key={request.id}>
                          <p className="text-sm font-bold">
                            {request.peer_name}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void perform(
                                  { action: 'accept', roomId: request.id },
                                  () => {
                                    window.location.assign(
                                      `/chat/${request.id}`,
                                    );
                                  },
                                )
                              }
                              className="min-h-11 rounded-xl bg-[#225343] px-4 text-xs font-bold text-white"
                            >
                              {txt('ஏற்று', 'Accept')}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void perform({
                                  action: 'decline',
                                  roomId: request.id,
                                })
                              }
                              className="min-h-11 rounded-xl border border-[#b9cfb2] px-4 text-xs font-bold"
                            >
                              {txt('மறுக்க', 'Decline')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                <section className="rounded-3xl border border-[#dbe5de] bg-white p-5">
                  <h2 className="mb-3 text-sm font-bold">
                    {txt('உரையாடல்கள்', 'Conversations')}
                  </h2>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {state.rooms
                      .filter((r) => r.status !== 'declined')
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectRoom(item)}
                          aria-pressed={roomId === item.id}
                          className={`min-h-14 w-full rounded-xl border p-3 text-left ${roomId === item.id ? 'border-[#a0bc96] bg-[#eef4e8]' : 'border-transparent bg-[#f6f8f5]'}`}
                        >
                          <span className="block truncate text-sm font-bold">
                            {item.peer_name ??
                              txt('நண்பருக்கான அழைப்பு', 'Invitation for a friend')}
                          </span>
                          <span className="mt-1 block text-xs text-[#60776c]">
                            {item.status === 'active'
                              ? txt('பேசலாம்', 'Accepted')
                              : item.status === 'pending'
                                ? txt(
                                    'அனுமதிக்காகக் காத்திருக்கிறது',
                                    'Waiting for acceptance',
                                  )
                                : txt('முடிந்தது', 'Ended')}
                          </span>
                        </button>
                      ))}
                    {!state.rooms.length && (
                      <p className="text-xs leading-6 text-[#60776c]">
                        {txt(
                          'ஒரு private link உருவாக்கி தொடங்குங்கள்.',
                          'Create a private link to start your first conversation.',
                        )}
                      </p>
                    )}
                  </div>
                </section>
              </aside>

              <section
                ref={chatPanel}
                className={`min-w-0 scroll-mt-4 overflow-hidden rounded-3xl border border-[#dbe5de] bg-white ${roomId ? 'order-first lg:order-last' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e8de] px-5 py-4">
                  <div>
                    <h2 className="font-bold">
                      {room?.peer_name ??
                        txt('உங்கள் private chat', 'Your private chat')}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-xs text-[#60776c]">
                      <span
                        className={`size-1.5 rounded-full ${connected ? 'bg-[#4e8b55]' : 'bg-amber-500'}`}
                      />
                      {connected
                        ? txt('தானாகப் புதுப்பிக்கப்படும்', 'Updates automatically')
                        : txt('மீண்டும் இணைக்கிறது…', 'Reconnecting…')}
                    </p>
                  </div>
                  {room && room.status !== 'ended' && (
                    <div className="flex gap-2">
                      <a
                        href="#chat-controls"
                        className="inline-flex min-h-11 items-center rounded-xl border border-[#dbe5de] px-3 text-xs font-semibold lg:hidden"
                      >
                        {txt('அழைப்புகள்', 'Invites')}
                      </a>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmAction('end')}
                        className="min-h-11 rounded-xl border border-[#dbe5de] px-3 text-xs font-semibold"
                      >
                        {txt('முடி', 'End')}
                      </button>
                      {room.peer_id && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmAction('block')}
                          className="min-h-11 rounded-xl border border-red-100 px-3 text-xs font-semibold text-red-800"
                        >
                          {txt('Block', 'Block')}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {shareLink && room?.status === 'pending' && (
                  <div className="m-4 rounded-2xl border border-[#c7d6bf] bg-[#f0f5e9] p-4">
                    <p className="text-sm font-bold">
                      {txt(
                        'நண்பருடன் மட்டும் பகிருங்கள்',
                        'Share this only with your friend',
                      )}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-[#60776c]">
                      {txt(
                        'முதலில் ஏற்கும் நபர் இணைவார். அதன்பிறகு link செயலிழக்கும். மீண்டும் தேவைப்பட்டால் புதிய link உருவாக்குங்கள்.',
                        'The first person to accept takes the second seat, then the link stops working. Create a new link if needed.',
                      )}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        readOnly
                        value={shareLink}
                        aria-label="Private invitation link"
                        className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d0ddc6] bg-white px-3 text-xs"
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        type="button"
                        onClick={copyLink}
                        className="flex min-h-11 items-center gap-2 rounded-xl bg-[#225343] px-4 text-xs font-bold text-white"
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}{' '}
                        {copied
                          ? txt('நகலெடுத்தது', 'Copied')
                          : txt('Link நகலெடு', 'Copy link')}
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className="h-[52dvh] min-h-80 overflow-y-auto overscroll-contain bg-[#f8faf6] p-4 sm:p-6"
                  role="log"
                  aria-label={txt('Chat செய்திகள்', 'Chat messages')}
                  aria-live="polite"
                  aria-relevant="additions text"
                >
                  {!room || room.status !== 'active' ? (
                    <div className="flex min-h-72 flex-col items-center justify-center text-center">
                      <span className="mb-5 grid size-16 place-items-center rounded-full bg-[#e9f0e1]">
                        <MessageCircle size={27} aria-hidden="true" />
                      </span>
                      <h3 className="max-w-sm text-lg font-bold leading-8">
                        {room?.status === 'ended'
                          ? txt(
                              'இந்த உரையாடல் முடிந்தது',
                              'This conversation has ended',
                            )
                          : room?.status === 'declined'
                            ? txt('அழைப்பு மறுக்கப்பட்டது', 'Invitation declined')
                            : room
                              ? txt(
                                  'இருவரின் அனுமதிக்காகக் காத்திருக்கிறது',
                                  'Waiting for both people to agree',
                                )
                              : txt(
                                  'ஒரு நல்ல உரையாடலுக்கு இடம்',
                                  'A little space for a good conversation',
                                )}
                      </h3>
                      <p className="mt-3 max-w-sm text-sm leading-7 text-[#60776c]">
                        {room?.status === 'pending'
                          ? txt(
                              'ஏற்றுக்கொள்ளும் வரை எந்தச் செய்தியும் அனுப்ப முடியாது.',
                              'No messages can be sent until the invitation is accepted.',
                            )
                          : txt(
                              'புதிய private link உருவாக்குங்கள் அல்லது விருப்பமுள்ள creator-க்கு அழைப்பு அனுப்புங்கள்.',
                              'Create a private invitation, or request a chat with an available creator.',
                            )}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!state.messages.length && (
                        <p className="py-7 text-center text-sm text-[#60776c]">
                          {txt(
                            'அழைப்பு ஏற்கப்பட்டது. ஒரு வணக்கம் சொல்லுங்கள்!',
                            'Invitation accepted. Say hello!',
                          )}
                        </p>
                      )}
                      {state.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === me.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[90%] sm:max-w-[80%]">
                            <p
                              className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 [overflow-wrap:anywhere] ${message.sender_id === me.id ? 'rounded-br-sm bg-[#225343] text-white' : 'rounded-bl-sm border border-[#dbe5de] bg-white'}`}
                            >
                              {message.body}
                            </p>
                            <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-[#60776c]">
                              <time dateTime={message.created_at}>
                                {new Date(
                                  message.created_at,
                                ).toLocaleTimeString(
                                  tamil ? 'ta-IN' : 'en-IN',
                                  { hour: '2-digit', minute: '2-digit' },
                                )}
                              </time>
                              {message.sender_id !== me.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReport(message);
                                    setReason('');
                                  }}
                                  className="min-h-9 underline underline-offset-2"
                                >
                                  {txt('புகாரளி', 'Report')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={lastMessage} />
                    </div>
                  )}
                </div>
                <form onSubmit={send} className="border-t border-[#e0e8de] p-4">
                  <label className="sr-only" htmlFor="chat-message">
                    {txt('உங்கள் செய்தி', 'Your message')}
                  </label>
                  <div className="flex items-end gap-2">
                    <textarea
                      id="chat-message"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={1200}
                      rows={2}
                      disabled={room?.status !== 'active'}
                      placeholder={
                        room?.status === 'active'
                          ? txt(
                              'தமிழிலும் பேசலாம்…',
                              'Tamil or English—say hello…',
                            )
                          : txt(
                              'அனுமதி கிடைத்ததும் பேசலாம்',
                              'Chat opens after acceptance',
                            )
                      }
                      className="min-h-12 min-w-0 flex-1 resize-y rounded-xl border border-[#ccd9c6] bg-white px-4 py-3 text-sm leading-6 disabled:bg-[#f3f5f0]"
                    />
                    <button
                      type="submit"
                      disabled={
                        busy ||
                        !draft.trim() ||
                        room?.status !== 'active' ||
                        !connected
                      }
                      aria-label={txt('செய்தி அனுப்பு', 'Send message')}
                      className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#225343] text-white disabled:opacity-40"
                    >
                      {busy ? (
                        <LoaderCircle size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between gap-3 text-[11px] leading-5 text-[#60776c]">
                    <span>
                      {txt(
                        'கடைசி 100 செய்திகள் · 24 மணி நேரம் வரை',
                        'Latest 100 messages · Up to 24 hours',
                      )}
                    </span>
                    <span>{draft.length}/1200</span>
                  </div>
                </form>
              </section>
            </div>
          </>
        )}

        {confirmAction && (
          <dialog
            ref={confirmDialog}
            onCancel={() => setConfirmAction(null)}
            aria-labelledby="confirm-title"
            className="fixed inset-0 z-50 m-0 h-[100dvh] max-h-none w-full max-w-none place-items-center overflow-y-auto border-0 bg-transparent p-4 open:grid backdrop:bg-[#10261d]/60"
          >
            <div className="w-full max-w-md rounded-3xl bg-white p-6">
              <h2 id="confirm-title" className="text-lg font-bold">
                {confirmAction === 'leave'
                  ? txt('Guest session-ஐ முடிக்கவா?', 'Leave this guest session?')
                  : confirmAction === 'block'
                    ? txt('இந்த நபரை block செய்யவா?', 'Block this person?')
                    : txt('உரையாடலை முடிக்கவா?', 'End this conversation?')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#60776c]">
                {confirmAction === 'leave'
                  ? txt(
                      'உங்கள் chats முடிவடையும். புதிய guest session-ல் பழைய chats-ஐ மீட்க முடியாது.',
                      'Your chats will close. A new guest session cannot restore these conversations.',
                    )
                  : confirmAction === 'block'
                    ? txt(
                        'உங்களுக்கிடையிலான chats முடியும். இந்த guest session உங்களை மீண்டும் அழைக்க முடியாது.',
                        'Your conversations will close. This guest session cannot request another chat with you.',
                      )
                    : txt(
                        'இருவரும் இந்த chat-ல் புதிய செய்திகள் அனுப்ப முடியாது.',
                        'Neither person will be able to send further messages in this chat.',
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
                  onClick={confirm}
                  className="min-h-11 rounded-xl bg-[#225343] px-4 text-sm font-bold text-white"
                >
                  {txt('ஆம், தொடரவும்', 'Yes, continue')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmAction(null)}
                  className="min-h-11 rounded-xl border px-4 text-sm font-bold"
                >
                  {txt('ரத்து', 'Cancel')}
                </button>
              </div>
            </div>
          </dialog>
        )}
        {report && (
          <dialog
            ref={reportDialog}
            onCancel={() => setReport(null)}
            aria-labelledby="report-title"
            className="fixed inset-0 z-50 m-0 h-[100dvh] max-h-none w-full max-w-none place-items-center overflow-y-auto border-0 bg-transparent p-4 open:grid backdrop:bg-[#10261d]/60"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void perform(
                  { action: 'report', roomId, messageId: report.id, reason },
                  () => {
                    setReport(null);
                    setNotice(
                      txt(
                        'புகார் அனுப்பப்பட்டது. தேவைப்பட்டால் அந்த நபரை block செய்யலாம்.',
                        'Report submitted. You can also block the person.',
                      ),
                    );
                  },
                );
              }}
              className="w-full max-w-md rounded-3xl bg-white p-6"
            >
              <h2 id="report-title" className="text-lg font-bold">
                {txt('செய்தியைப் புகாரளிக்க', 'Report this message')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#60776c]">
                {txt(
                  'இந்தச் செய்தி மற்றும் உங்கள் காரணம் moderator-க்கு அனுப்பப்படும்.',
                  'This message and your reason will be shared with a moderator.',
                )}
              </p>
              <label className="mt-4 block text-sm font-bold">
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
                  {txt('புகாரை அனுப்பு', 'Submit report')}
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

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs leading-6 text-[#60776c]">
          <p>
            {txt(
              'தனிப்பட்ட தகவல், OTP அல்லது பண விவரங்களைப் பகிர வேண்டாம்.',
              'Keep passwords, OTPs and payment details out of chat.',
            )}
          </p>
          <div className="flex gap-5">
            <Link href="/community-chat/rules" className="underline">
              {txt('Chat விதிகள்', 'Chat rules')}
            </Link>
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
            <Link href="/contact" className="underline">
              Contact
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
