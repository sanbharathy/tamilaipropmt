'use client';
import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import type { ChatRoom } from '@/lib/chat-types';

export function ChatPresence({
  room,
  tamil,
  connected,
  compact = false,
}: {
  room: ChatRoom;
  tamil: boolean;
  connected: boolean;
  compact?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const online =
    connected &&
    room.peer_viewing &&
    (!now ||
      (!!room.peer_active_until &&
        new Date(room.peer_active_until).getTime() > now));
  const typing =
    online &&
    !!room.peer_typing_until &&
    !!now &&
    new Date(room.peer_typing_until).getTime() > now;
  const seen = room.peer_last_seen ? new Date(room.peer_last_seen) : null;
  const today =
    seen && now && seen.toDateString() === new Date(now).toDateString();
  const time = seen
    ? new Intl.DateTimeFormat(tamil ? 'ta-IN' : 'en-IN', {
        ...(today ? {} : { day: 'numeric' as const, month: 'short' as const }),
        hour: 'numeric',
        minute: '2-digit',
      }).format(seen)
    : '';
  const text = !connected
    ? tamil
      ? 'நிலை தெரியவில்லை'
      : 'Presence unavailable'
    : online
      ? tamil
        ? 'ஆன்லைனில் உள்ளார்'
        : 'Online'
      : seen
        ? tamil
          ? `கடைசி: ${time}`
          : `Last active: ${time}`
        : tamil
          ? 'இந்த chat-க்கு இன்னும் வரவில்லை'
          : 'Not seen in this chat yet';
  return (
    <span
      aria-live="polite"
      data-presence={!connected ? 'unavailable' : online ? 'online' : 'offline'}
      className="flex min-w-0 items-center gap-1.5"
      title={
        tamil
          ? 'Chat திரை தெரியும்போதும் focus-ல் இருக்கும்போதும் இந்த நிலை புதுப்பிக்கப்படும். இணைப்பு துண்டானால் 20 விநாடிகள் வரை தாமதமாகலாம். இது read receipt அல்ல.'
          : 'Updated while this chat screen is visible and focused. Disconnects can take up to 20 seconds to appear. This is not a read receipt.'
      }
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${!connected ? 'bg-slate-400' : online ? 'bg-emerald-500' : 'bg-red-500'}`}
      />
      <span className="min-w-0">
        {typing ? (
          <span className="flex items-center gap-1.5 text-[#218568]">
            <Pencil
              size={12}
              className="chat-typing-pencil"
              aria-hidden="true"
            />
            <span>{tamil ? 'எழுதுகிறார்' : 'Typing'}</span>
            <span className="chat-typing-dots flex gap-0.5" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </span>
        ) : (
          <span className="block truncate">
            {compact && connected
              ? online
                ? tamil
                  ? 'ஆன்லைனில் உள்ளார்'
                  : 'Online'
                : tamil
                  ? 'ஆஃப்லைன்'
                  : 'Offline'
              : text}
          </span>
        )}
        {compact && (
          <span
            className="block truncate text-[9px] opacity-80"
            title={seen ? `Last active: ${time}` : 'No activity recorded yet'}
          >
            {seen ? `Last active: ${time}` : 'No activity yet'}
          </span>
        )}
      </span>
    </span>
  );
}
