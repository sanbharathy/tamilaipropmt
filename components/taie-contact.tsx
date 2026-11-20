'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Copy, MoreVertical, House } from 'lucide-react';
type Room = { id: string; peer_name: string; expires_at: string };
type State = {
  me: null | { role: 'owner' | 'visitor'; name: string };
  rooms: Room[];
};
const notice =
  'Each chat lasts up to 24 hours and can end earlier. Messages, smaller copies of images, nicknames and timestamps are saved in an admin-only security PDF for 30 days after the chat ends, then automatically deleted. This is not end-to-end encrypted. Your private return link remains usable for a new chat; keep it to yourself.';
async function call(body?: Record<string, unknown>) {
  const response = await fetch('/api/chat/contact', {
    method: body ? 'POST' : 'GET',
    cache: 'no-store',
    ...(body
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || 'Unable to connect. Please retry.');
  return data;
}
export function TaieContact() {
  const [state, setState] = useState<State>({ me: null, rooms: [] });
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [ownerLogin, setOwnerLogin] = useState(false),
    [menu, setMenu] = useState(false),
    [accepted, setAccepted] = useState(false);
  const [name, setName] = useState(''),
    [key, setKey] = useState(''),
    [copyStatus, setCopyStatus] = useState('');
  const [returnLink, setReturnLink] = useState('');
  const startup = useRef<Promise<void> | null>(null);
  const refresh = useCallback(async () => {
    setState(await call());
    setReady(true);
  }, []);
  useEffect(() => {
    let stopped = false;
    const start = async () => {
      const secret = new URLSearchParams(location.hash.slice(1)).get('return');
      if (secret) {
        history.replaceState(null, '', '/taie-contact');
        await call({ action: 'restore', secret });
      }
    };
    // React strict-mode replays effects; never consume a return link twice.
    startup.current ??= start();
    void startup.current
      .then(() => {
        if (!stopped) return refresh();
      })
      .catch((e) => {
        if (!stopped) {
          setError(e.message);
          setReady(true);
        }
      });
    const interval = setInterval(() => {
      if (!document.hidden) void refresh().catch((e) => setError(e.message));
    }, 12000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [refresh]);
  async function perform(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      const data = await call(body);
      if (data.roomId) {
        location.assign(`/chat/${data.roomId}?from=taie`);
        return;
      }
      setKey('');
      setOwnerLogin(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copyReturn() {
    setError('');
    try {
      const { link } = await call({ action: 'return-link' });
      setReturnLink(link);
      try {
        await navigator.clipboard.writeText(link);
        setCopyStatus('Private return link copied. Keep it to yourself.');
      } catch {
        setCopyStatus('Select and copy your private return link below.');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main
      lang="en"
      className="mx-auto flex min-h-dvh max-w-lg flex-col bg-[#f7f5f0] px-5 py-5 text-[#20372f]"
    >
      <header className="relative flex min-h-12 items-center justify-between">
        <h1 className="sr-only">Conversations</h1>
        <button type="button" aria-label="Home - return to image editor" onClick={() => window.location.assign('/taie-contact/close')} className="flex min-h-12 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-sm transition hover:bg-[#edf4ef]">
          <House size={19} aria-hidden="true" /> Home
        </button>
        <button
          aria-label="Chat options"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
          className="grid size-11 place-items-center rounded-full"
        >
          <MoreVertical size={20} />
        </button>
        {menu && (
          <div className="absolute right-0 top-12 z-10 min-w-48 rounded-2xl border border-[#e1e5d7] bg-white p-2 shadow-lg">
            {ownerLogin && (
              <button
                className="min-h-12 w-full px-3 text-left text-sm"
                onClick={() => {
                  setOwnerLogin(false);
                  setMenu(false);
                }}
              >
                Back
              </button>
            )}
            <button
              className="min-h-12 w-full px-3 text-left text-sm"
              onClick={() => window.location.assign('/taie-contact/close')}
            >
              Return to editor
            </button>
            {state.me?.role === 'owner' ? (
              <button
                className="min-h-12 w-full px-3 text-left text-sm"
                onClick={() => {
                  setMenu(false);
                  void perform({ action: 'owner-logout' });
                }}
              >
                Sign out
              </button>
            ) : (
              <button
                className="min-h-12 w-full px-3 text-left text-sm"
                onClick={() => {
                  setMenu(false);
                  setOwnerLogin(true);
                  setAccepted(false);
                }}
              >
                Owner sign-in
              </button>
            )}
          </div>
        )}
      </header>
      <section className="flex flex-1 flex-col justify-center py-8">
        {!ready ? (
          <output>Connecting…</output>
        ) : ownerLogin ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void perform({ action: 'owner-login', key, accepted });
            }}
            className="space-y-5"
          >
            <h2 className="text-2xl font-semibold">Owner sign-in</h2>
            <p className="text-sm leading-6 text-[#738172]">
              Sign in to reply to your visitors. Visitors do not need an owner
              key.
            </p>
            <label className="block text-sm font-semibold">
              Owner key
              <input
                aria-label="Owner key"
                type="password"
                autoComplete="current-password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
                maxLength={200}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#d9dfd1] bg-white p-3"
              />
            </label>
            <p className="text-xs leading-6 text-[#738172]">{notice}</p>
            <label className="flex gap-3 text-xs leading-5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              I have read and accept the 30-day security archive notice.
            </label>
            <button
              disabled={busy || !accepted}
              className="min-h-12 w-full rounded-xl bg-[#20372f] px-4 font-semibold text-white disabled:opacity-40"
            >
              Sign in
            </button>
          </form>
        ) : state.me?.role === 'owner' ? (
          <div>
            <p className="mb-5 text-sm text-[#738172]">
              Open a conversation to reply. Chats end after 24 hours or when
              destroyed.
            </p>
            {!state.rooms.length && (
              <p className="rounded-2xl bg-white p-6 text-sm">
                No active chats yet. Visitors will appear here when they start a
                chat.
              </p>
            )}
            <div className="space-y-3">
              {state.rooms.map((room) => (
                <button
                  key={room.id}
                  disabled={busy}
                  onClick={() =>
                    void perform({ action: 'open', roomId: room.id })
                  }
                  className="flex min-h-20 w-full items-center justify-between rounded-2xl border border-[#e1e5d7] bg-white px-5 text-left"
                >
                  <span>
                    <strong className="block">{room.peer_name}</strong>
                    <small className="text-[#738172]">
                      Ends{' '}
                      {new Date(room.expires_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          </div>
        ) : state.me ? (
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold">Hello, {state.me.name}.</h2>
            <p className="text-sm leading-6 text-[#738172]">
              {state.rooms.length
                ? 'Continue your private chat with the app owner.'
                : 'Your previous chat has ended. Your permanent return link can start a fresh chat.'}
            </p>
            <button
              disabled={busy}
              onClick={() => void perform({ action: 'open' })}
              className="min-h-14 w-full rounded-2xl bg-[#ed6344] px-5 font-semibold text-white disabled:opacity-40"
            >
              {state.rooms.length ? 'Open chat' : 'Start a fresh chat'}{' '}
              <span aria-hidden="true">↗</span>
            </button>
            <button
              onClick={() => void copyReturn()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#d9dfd1] text-sm"
            >
              <Copy size={16} />
              Copy my private return link
            </button>
            {copyStatus && (
              <output className="block text-xs leading-5">{copyStatus}</output>
            )}
            {returnLink && (
              <input
                aria-label="Private return link"
                readOnly
                value={returnLink}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-xl border border-[#d9dfd1] bg-white p-3 text-xs"
              />
            )}
            <p className="text-xs leading-6 text-[#738172]">{notice}</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void perform({ action: 'start', name, accepted });
            }}
            className="space-y-5"
          >
            <h2 className="text-3xl font-semibold">Say hello.</h2>
            <p className="text-sm leading-6 text-[#738172]">
              A private, one-to-one conversation with the app owner. Other
              visitors cannot see your chat.
            </p>
            <label className="block text-sm font-semibold">
              Your nickname
              <input
                aria-label="Your nickname"
                autoComplete="off"
                required
                minLength={2}
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#d9dfd1] bg-white p-3"
              />
            </label>
            <p className="text-xs leading-6 text-[#738172]">{notice}</p>
            <label className="flex gap-3 text-xs leading-5">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              I am 13 or older and have read the chat rules and 30-day security
              archive notice.
            </label>
            <Link
              href="/community-chat/rules"
              className="block text-xs underline"
            >
              Chat rules and privacy
            </Link>
            <button
              disabled={busy || !accepted}
              className="min-h-14 w-full rounded-2xl bg-[#ed6344] px-5 font-semibold text-white disabled:opacity-40"
            >
              Start chat ↗
            </button>
          </form>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
