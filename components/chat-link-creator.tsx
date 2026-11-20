'use client';
import { useEffect, useState } from 'react';
import { copyChatLink } from '@/lib/chat-copy';
export function ChatLinkCreator({ onBack }: { onBack: () => void }) {
  const [chats, setChats] = useState<
      { id: string; status: string; peer_name: string | null }[]
    >([]),
    [name, setName] = useState(''),
    [joined, setJoined] = useState(false),
    [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [link, setLink] = useState(''),
    [feedback, setFeedback] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/chat', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setJoined(!!d.me);
          setChats(
            (d.rooms || []).filter(
              (r: { admin_review?: boolean; status: string }) =>
                r.admin_review && ['active', 'pending'].includes(r.status),
            ),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function create() {
    setBusy(true);
    setError('');
    try {
      async function post(body: object) {
        const r = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error || 'Could not create a chat.');
        return d;
      }
      if (!joined) {
        await post({
          action: 'join',
          name,
          accepted: true,
          archiveConsent: true,
        });
        setJoined(true);
      }
      const data = await post({ action: 'create', reviewAccepted: true });
      const address = `${location.origin}/chat/${data.roomId}?from=taie#invite=${data.invite}`;
      try {
        sessionStorage.setItem('taie-invite:' + data.roomId, address);
      } catch {}
      setLink(address);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Could not create a link.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="min-h-12 text-sm font-semibold"
      >
        ← Conversations
      </button>
      <h2 className="text-2xl font-semibold">One link. Just you two.</h2>
      <p className="text-sm leading-6 text-[#66796d]">
        Create a private invitation for one friend. They can join from their
        browser. The chat ends after 24 hours, or you can end or destroy it
        sooner.
      </p>
      {chats.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Your link chats</h3>
          {chats.map((chat) => (
            <a
              key={chat.id}
              href={'/chat/' + chat.id + '?from=taie'}
              onClick={(e) => {
                try {
                  const saved = sessionStorage.getItem(
                    'taie-invite:' + chat.id,
                  );
                  if (saved && chat.status === 'pending') {
                    e.preventDefault();
                    location.assign(saved);
                  }
                } catch {}
              }}
              className="block rounded-xl border bg-white p-4 text-sm"
            >
              {chat.peer_name || 'Waiting for your friend'} →
            </a>
          ))}
        </div>
      )}
      {!link ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void create();
          }}
          className="space-y-4"
        >
          {!joined && (
            <label className="block text-sm font-semibold">
              Your nickname
              <input
                required
                minLength={2}
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border bg-white px-3"
              />
            </label>
          )}
          <label className="flex items-start gap-3 rounded-xl bg-white p-4 text-xs leading-6">
            <input
              type="checkbox"
              required
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 size-5 shrink-0"
            />
            <span>
              I understand that authorized admins can review messages in this
              chat and shared images while it is active. Messages, reduced-size
              images, names and timestamps are retained in a security PDF for 30
              days after it ends. This chat is not end-to-end encrypted. My
              friend must agree before joining.
            </span>
          </label>
          <button
            disabled={busy || !accepted}
            className="min-h-12 w-full rounded-xl bg-[#225343] px-4 font-semibold text-white disabled:opacity-40"
          >
            {busy ? 'Creating…' : 'Create chat link'}
          </button>
        </form>
      ) : (
        <div className="space-y-3 rounded-2xl bg-white p-5">
          <label className="block text-sm font-semibold">
            Share with one friend
            <input
              aria-label="Your chat invitation link"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="mt-2 min-h-12 w-full rounded-xl border px-3 text-xs"
            />
          </label>
          <button
            className="min-h-12 w-full rounded-xl bg-[#225343] font-semibold text-white"
            onClick={async () =>
              setFeedback(
                (await copyChatLink(link))
                  ? 'Link copied! Share it with your friend.'
                  : 'Touch and hold the link above to copy it.',
              )
            }
          >
            Copy link
          </button>
          <a
            href={link}
            className="grid min-h-12 place-items-center rounded-xl border font-semibold"
          >
            Open chat
          </a>
          <output className="block text-xs leading-6">{feedback}</output>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
