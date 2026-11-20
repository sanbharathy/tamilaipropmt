'use client';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
type Room = {
  id: string;
  host_name: string;
  guest_name: string | null;
  status: string;
};
type Message = {
  id: string;
  body: string;
  sender_name: string;
  created_at: string;
  has_image: boolean;
};
export function ChatAdminConversations() {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState(''),
    [rooms, setRooms] = useState<Room[]>([]),
    [messages, setMessages] = useState<Message[]>([]),
    [error, setError] = useState(''),
    [image, setImage] = useState('');
  const load = useCallback(async () => {
    const response = await fetch(
      '/api/chat/contact/review' +
        (selected ? '?room=' + encodeURIComponent(selected) : ''),
      { cache: 'no-store' },
    );
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Could not load chats.');
    setRooms(data.rooms);
    setMessages(data.messages);
    setError('');
  }, [selected]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const refresh = () => {
      if (document.hidden) return;
      void load().catch((e) => {
        if (active) {
          setError(e.message);
          setMessages([]);
          setImage('');
        }
      });
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [open, load]);
  return (
    <section className="mb-7 rounded-2xl border border-[#d9e3da] bg-white p-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="min-h-12 w-full text-left font-semibold"
      >
        {open ? 'Close link-chat review' : 'Review link chats'}{' '}
        <span className="text-xs font-normal">· Owner only</span>
      </button>
      {open && (
        <div className="space-y-4">
          <p className="text-xs leading-6 text-[#66796d]">
            Only new links created with the admin-review notice appear here.
            Both participants must agree before chatting. The newest 100
            messages are shown; review access is logged. Active chats refresh
            every five seconds.
          </p>
          <label className="block text-sm">
            Conversation
            <select
              aria-label="Conversation to review"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setMessages([]);
                setImage('');
              }}
              className="mt-2 min-h-12 w-full rounded-xl border px-3"
            >
              <option value="">Choose a conversation</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.host_name} / {room.guest_name || 'Waiting for friend'} ·{' '}
                  {room.status}
                </option>
              ))}
            </select>
          </label>
          {!rooms.length && (
            <p className="text-sm">No active link chats to review.</p>
          )}
          {selected && (
            <button
              type="button"
              onClick={() => void load().catch((e) => setError(e.message))}
              className="min-h-12 rounded-xl border px-4 text-sm"
            >
              Refresh conversation
            </button>
          )}
          {error && (
            <p role="alert" className="text-xs text-red-800">
              {error}
            </p>
          )}
          <div className="max-h-[50dvh] space-y-3 overflow-y-auto">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl bg-[#f3f6f1] p-3 text-xs"
              >
                <div className="flex justify-between gap-3">
                  <strong>{message.sender_name}</strong>
                  <time className="text-[10px]">
                    {new Date(message.created_at).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words">
                  {message.body}
                </p>
                {message.has_image && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImage(image === message.id ? '' : message.id)
                      }
                      className="mt-2 min-h-11 underline"
                    >
                      {image === message.id
                        ? 'Hide image'
                        : 'View shared image'}
                    </button>
                    {image === message.id && (
                      <Image
                        unoptimized
                        width={512}
                        height={512}
                        src={'/api/chat/contact/review/image/' + message.id}
                        alt="Shared attachment for admin review"
                        className="mt-2 max-h-64 max-w-full rounded-lg object-contain"
                      />
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
