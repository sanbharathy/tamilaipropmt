'use client';
import { copyChatLink } from '@/lib/chat-copy';
import { ChatArchiveNotice } from '@/components/chat-archive-notice';
import { ChatPresence } from '@/components/chat-presence';
import {
  ChatThemePicker,
  chatThemes,
  type ChatTheme,
} from '@/components/chat-theme-picker';
import { ChatCamera } from '@/components/chat-camera';
import { CAMERA_MOTION } from '@/lib/chat-camera';
import { isSingleEmoji } from '@/lib/chat-emoji';
import { ChatDrawing } from '@/components/chat-drawing';
import { ChatGames } from '@/components/chat-games';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  LoaderCircle,
  LockKeyhole,
  Send,
  X,
  EllipsisVertical,
  Expand,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import type { ChatMessage, ChatState } from '@/lib/chat-types';
import { DestroyChatButton } from '@/components/destroy-chat-button';
import { ChatPhotoViewer } from '@/components/chat-photo-viewer';
import { ChatMessageBody } from '@/components/chat-message-body';
import { ChatStickerPicker } from '@/components/chat-sticker-picker';
import { ChatStickerCard } from '@/components/chat-sticker-card';
import {
  findChatSticker,
  chatStickerPreview,
  stickerBody,
  type ChatSticker,
} from '@/lib/chat-stickers';
import { compressChatImage } from '@/lib/chat-image-client';
import { loveEmoji, REPLY_TEXT_LIMIT } from '@/lib/chat-interactions';
import {
  MessagePressable,
  ChatActionDialog,
  ChatAttachmentMenu,
  ChatReportPicker,
  ChatEmojiShower,
} from '@/components/chat-message-actions';
import './private-chat.css';

const blank: ChatState = {
  me: null,
  rooms: [],
  room: null,
  people: [],
  messages: [],
};
function ChatImage({
  id,
  onOpen,
  tamil,
}: {
  id: string;
  onOpen: (id: string) => void;
  tamil: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="p-3 text-xs">Image cleared or unavailable.</p>
  ) : (
    <a
      href={`/api/chat/images/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        event.preventDefault();
        onOpen(id);
      }}
      aria-label={tamil ? 'படத்தைப் பெரிதாகப் பார்க்க' : 'View shared picture'}
      className="messenger-photo group relative block overflow-hidden rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#128577]"
    >
      {/* Authenticated private images must bypass the public Next.js image optimizer. */}
      {/* oxlint-disable-next-line */}
      <img
        src={`/api/chat/images/${id}`}
        alt="Shared attachment"
        width={1200}
        height={1200}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="max-h-80 min-w-36 w-auto max-w-full object-contain transition-[filter] group-hover:brightness-95"
      />
      <span className="absolute bottom-2 right-2 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-black/55 px-3 text-[10px] font-semibold text-white backdrop-blur-sm">
        <Expand size={12} aria-hidden="true" />
        {tamil ? 'பெரிதாகப் பார்க்க' : 'View picture'}
      </span>
    </a>
  );
}

export function PrivateChat({ roomId }: { roomId: string }) {
  const screen = useRef<HTMLElement>(null);
  const presenceScreen = useRef<string | null>(null);
  const presenceSequence = useRef(0);
  const observedReads = useRef(new Set<string>());
  const pendingReads = useRef(new Set<string>());
  const thread = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ChatState>(blank);
  const [tamil, setTamil] = useState(false);
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
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [reportPicker, setReportPicker] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const imageJob = useRef(0);
  const effectIds = useRef<Set<string> | null>(null);
  const [burst, setBurst] = useState<{ id: string; emoji: string } | null>(
    null,
  );
  const [image, setImage] = useState<File | null>(null);
  const [cameraMotion, setCameraMotion] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [preview, setPreview] = useState('');
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const invitationInput = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<'end' | 'block' | null>(null);
  const [report, setReport] = useState<ChatMessage | null>(null);
  const [reason, setReason] = useState('');
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [theme, setTheme] = useState<ChatTheme>('mint');
  const [showThemes, setShowThemes] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tamilai-chat-theme');
      if (chatThemes.some((choice) => choice.id === saved)) {
        // Hydrate the device preference after mounting.
        // oxlint-disable-next-line
        setTheme(saved as ChatTheme);
      }
    } catch {}
  }, []);
  function changeTheme(value: ChatTheme) {
    setTheme(value);
    try {
      localStorage.setItem('tamilai-chat-theme', value);
    } catch {}
  }
  const typingLast = useRef(0);
  const typingActive = useRef(false);
  const composer = useRef<HTMLTextAreaElement>(null);
  const actionsMenu = useRef<HTMLDetailsElement>(null);
  const inviteRef = useRef('');
  const version = useRef(0);
  const polling = useRef(false);
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const reportDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () =>
      screen.current?.style.setProperty(
        '--chat-viewport-height',
        `${viewport?.height ?? window.innerHeight}px`,
      );
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize);
      window.removeEventListener('resize', resize);
    };
  }, []);
  const me = state.me;
  const meId = me?.id;
  const room = state.room;
  const status = room?.status;
  const chatMessages = state.messages.filter(
    (message) => !message.game_event && !message.reaction_event,
  );
  const txt = (ta: string, en: string) => (tamil ? ta : en);

  const notifyTyping = useCallback(
    (typing: boolean) => {
      if (status !== 'active' || !me?.archive_notice) return;
      if (
        typing &&
        (!connected ||
          document.visibilityState !== 'visible' ||
          !document.hasFocus())
      )
        return;
      const now = Date.now();
      if (typing && typingActive.current && now - typingLast.current < 2000)
        return;
      if (!typing && !typingActive.current) return;
      typingActive.current = typing;
      typingLast.current = now;
      presenceScreen.current ??= crypto.randomUUID();
      void fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          roomId,
          screen: presenceScreen.current,
          sequence: ++presenceSequence.current,
          typing,
        }),
      }).catch(() => {});
    },
    [status, me?.archive_notice, connected, roomId],
  );
  useEffect(() => {
    if (!draft.trim() || showDrawing || showCamera || !connected) {
      notifyTyping(false);
      return;
    }
    notifyTyping(true);
    const timer = setTimeout(() => notifyTyping(false), 1600);
    return () => clearTimeout(timer);
  }, [draft, showDrawing, showCamera, connected, notifyTyping]);
  useEffect(() => {
    const stop = () => notifyTyping(false);
    const visibility = () => {
      if (document.visibilityState !== 'visible') stop();
    };
    window.addEventListener('blur', stop);
    window.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      stop();
      window.removeEventListener('blur', stop);
      window.removeEventListener('pagehide', stop);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [notifyTyping]);

  const readVisible = useCallback(() => {
    if (
      document.visibilityState !== 'visible' ||
      !document.hasFocus() ||
      document.querySelector('dialog[open]') ||
      !thread.current
    )
      return false;
    const viewport = thread.current.getBoundingClientRect();
    let changed = false;
    for (const marker of thread.current.querySelectorAll<HTMLElement>(
      '[data-read-message]',
    )) {
      const box = marker.getBoundingClientRect(),
        id = marker.dataset.readMessage;
      if (
        id &&
        box.top >= viewport.top &&
        box.bottom <= viewport.bottom &&
        !observedReads.current.has(id)
      ) {
        observedReads.current.add(id);
        pendingReads.current.add(id);
        changed = true;
      }
    }
    return changed;
  }, []);

  const load = useCallback(async () => {
    const current = ++version.current;
    let presenceQuery = '';
    let readBatch: string[] = [];
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      presenceScreen.current ??= crypto.randomUUID();
      readVisible();
      readBatch = [...pendingReads.current].slice(0, 100);
      presenceQuery = `&screen=${presenceScreen.current}&sequence=${++presenceSequence.current}${readBatch.length ? '&read=' + encodeURIComponent(readBatch.join(',')) : ''}`;
    }
    let response = await fetch(`/api/chat?room=${roomId}${presenceQuery}`, {
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
    for (const id of readBatch) pendingReads.current.delete(id);
    setState({
      ...data,
      rooms: [],
      people: [],
      ...(absent ? { room: null, messages: [] } : {}),
    });
    setMissing(absent);
    setConnected(true);
    setReady(true);
    if (
      ['active', 'ended', 'declined'].includes(data.room?.status) &&
      inviteRef.current
    ) {
      inviteRef.current = '';
      setInviteToken('');
      setInvitation(null);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [roomId, readVisible]);
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
    if (status !== 'active' || !me?.archive_notice) return;
    const hide = () => {
      if (!presenceScreen.current) return;
      void fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          roomId,
          screen: presenceScreen.current,
          sequence: ++presenceSequence.current,
          present: false,
        }),
      }).catch(() => {});
    };
    const focus = () => {
      if (document.visibilityState === 'visible' && document.hasFocus())
        void load().catch(() => setConnected(false));
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') hide();
      else focus();
    };
    const offline = () => setConnected(false);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', focus);
    window.addEventListener('pagehide', hide);
    window.addEventListener('offline', offline);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      hide();
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', focus);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('offline', offline);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [status, me?.archive_notice, roomId, load]);

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
      imageJob.current++;
      setProcessingImage(false);
      setReplyTo(null);
      setActionMessage(null);
      setShowDrawing(false);
      setShowCamera(false);
    }
  }, [status]);
  useEffect(
    () => () => {
      imageJob.current++;
    },
    [],
  );
  useEffect(() => {
    if (!ready || !state.server_time) return;
    const events = [
      ...(state.reaction_events ?? [])
        .filter((event) => event.active)
        .map((event) => ({
          id: 'r' + event.id,
          emoji: loveEmoji(event.emoji),
          at: event.created_at,
        })),
      ...state.messages
        .filter((message) => !message.game_event && !message.reaction_event)
        .map((message) => ({
          id: 'm' + message.id,
          emoji: loveEmoji(message.body),
          at: message.created_at,
        })),
    ];
    if (!effectIds.current) {
      effectIds.current = new Set(events.map((event) => event.id));
      return;
    }
    let latest: { id: string; emoji: string } | null = null;
    for (const event of events.sort(
      (a, b) => Date.parse(a.at) - Date.parse(b.at),
    )) {
      if (effectIds.current.has(event.id)) continue;
      effectIds.current.add(event.id);
      const age = Date.parse(state.server_time) - Date.parse(event.at);
      if (
        event.emoji &&
        age >= -1000 &&
        age < 15000 &&
        document.visibilityState === 'visible' &&
        document.hasFocus()
      )
        latest = { id: event.id, emoji: event.emoji };
    }
    if (effectIds.current.size > 2000)
      effectIds.current = new Set(events.map((event) => event.id));
    // Only new, recent activity animates; loading conversation history never does.
    // oxlint-disable-next-line
    if (latest) setBurst(latest);
  }, [state, ready]);
  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst(null), 4500);
    return () => clearTimeout(timer);
  }, [burst]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest' });
  }, [chatMessages.length]);
  useEffect(() => {
    if (state.game?.id) {
      // Open newly received game invitations without moving focus from chat.
      // oxlint-disable-next-line
      setShowGames(true);
    }
  }, [state.game?.id]);
  useEffect(() => {
    if (status !== 'active' || !thread.current) return;
    const observer = new IntersectionObserver(
      () => {
        if (readVisible()) void load().catch(() => setConnected(false));
      },
      { root: thread.current, threshold: 1 },
    );
    thread.current
      .querySelectorAll('[data-read-message]')
      .forEach((marker) => observer.observe(marker));
    return () => observer.disconnect();
  }, [state.messages, status, readVisible, load]);
  useEffect(() => {
    if (confirm) confirmDialog.current?.showModal();
    if (report) reportDialog.current?.showModal();
  }, [confirm, report]);
  useEffect(() => {
    if (!draft && composer.current) composer.current.style.height = '48px';
  }, [draft]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        actionsMenu.current &&
        !actionsMenu.current.contains(event.target as Node)
      )
        actionsMenu.current.open = false;
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

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
  async function send(
    event: { preventDefault: () => void },
    attachment: File | null = image,
    motion = attachment === image && cameraMotion,
  ) {
    event.preventDefault();
    if (
      busy ||
      processingImage ||
      !connected ||
      status !== 'active' ||
      (!draft.trim() && !attachment)
    )
      return;
    if (!attachment) {
      await act(
        {
          action: 'send',
          text: draft,
          clientId: crypto.randomUUID(),
          replyTo: replyTo?.id,
        },
        () => {
          setDraft('');
          setReplyTo(null);
        },
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.set('image', attachment);
      if (motion) form.set('motion', CAMERA_MOTION);
      form.set('roomId', roomId);
      form.set('clientId', crypto.randomUUID());
      form.set('caption', draft);
      if (replyTo) form.set('replyTo', replyTo.id);
      const response = await fetch('/api/chat/images', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? 'Image could not be sent.');
      setImage(null);
      setDraft('');
      setReplyTo(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image could not be sent.');
    } finally {
      setBusy(false);
    }
  }
  async function sendSticker(sticker: ChatSticker) {
    if (busy || status !== 'active' || !connected) return;
    await act(
      {
        action: 'send',
        text: stickerBody(sticker),
        replyTo: replyTo?.id,
        clientId: crypto.randomUUID(),
      },
      () => {
        setShowStickers(false);
        setReplyTo(null);
      },
    );
  }
  async function chooseImage(file: File | undefined) {
    if (!file) return;
    const job = ++imageJob.current;
    setCameraMotion(false);
    setProcessingImage(true);
    setImage(null);
    setError('');
    try {
      const optimized = await compressChatImage(file);
      if (job === imageJob.current) setImage(optimized);
    } catch (error) {
      if (job === imageJob.current)
        setError(
          error instanceof Error ? error.message : 'Unable to process photo.',
        );
    } finally {
      if (job === imageJob.current) setProcessingImage(false);
    }
  }
  async function reactTo(message: ChatMessage, emoji: string) {
    if (busy || status !== 'active' || !connected) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          messageId: message.id,
          emoji,
          clientId: crypto.randomUUID(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to react.');
      setActionMessage(null);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to react.');
    } finally {
      setBusy(false);
    }
  }
  async function copyInvite() {
    const success = await copyChatLink(
      `${window.location.origin}/chat/${roomId}#invite=${inviteToken}`,
    );
    setCopied(success);
    setError('');
    setCopyFeedback(
      success
        ? txt(
            'இணைப்பு நகலெடுக்கப்பட்டது. நண்பருடன் பகிருங்கள்.',
            'Link copied! Share it with your friend.',
          )
        : txt(
            'தானாக நகலெடுக்க முடியவில்லை. தேர்ந்தெடுத்த இணைப்பை நீண்ட நேரம் தொட்டு Copy செய்யவும்.',
            'Automatic copying is blocked. Copy the selected link manually (touch and hold, or Ctrl/Cmd+C).',
          ),
    );
    if (!success) {
      invitationInput.current?.focus();
      invitationInput.current?.select();
      invitationInput.current?.setSelectionRange(
        0,
        invitationInput.current.value.length,
      );
    }
  }
  const incoming =
    room?.status === 'pending' &&
    room.guest_id === meId &&
    room.source === 'directory';
  const canAccept = invitation && !invitation.own && !room;

  if (me && !me.archive_notice)
    return (
      <ChatArchiveNotice
        busy={busy}
        error={error}
        onAccept={() => void act({ action: 'archive-consent', accepted: true })}
      />
    );

  return (
    <main
      ref={screen}
      data-chat-theme={theme}
      lang={tamil ? 'ta' : 'en'}
      className="messenger-screen relative isolate mx-auto flex h-dvh min-h-0 max-w-6xl flex-col overflow-hidden md:my-4 md:h-[calc(100dvh-2rem)] md:rounded-[28px]"
    >
      <ChatEmojiShower burst={burst} />
      <header className="messenger-header relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[#e1eae4] bg-white/95 px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/community-chat"
            aria-label="Back to chats"
            className="grid size-10 shrink-0 place-items-center rounded-full text-[#57756c] transition hover:bg-[#edf4ef]"
          >
            <ArrowLeft size={20} />
          </Link>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#167c6a] font-heading text-lg font-bold text-white shadow-[0_4px_12px_#167c6a24]">
            {room?.peer_name ? (
              Array.from(room.peer_name)[0].toUpperCase()
            ) : (
              <MessageCircle size={21} aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-bold sm:text-[17px]">
              {room?.peer_name ?? txt('தனிப்பட்ட உரையாடல்', 'Private conversation')}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-[#6a8179] sm:text-[11px]">
              {status === 'active' ? (
                <ChatPresence
                  room={room!}
                  tamil={tamil}
                  connected={connected}
                />
              ) : (
                txt(
                  'Private invite · உங்கள் விருப்பப்படி',
                  'Private invite · On your terms',
                )
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTamil(!tamil)}
            className="min-h-10 rounded-full bg-[#f0f5f2] px-3 text-[11px] font-bold text-[#4a6e62]"
          >
            {tamil ? 'EN' : 'தமிழ்'}
          </button>
          <details ref={actionsMenu} className="messenger-actions relative">
            <summary
              aria-label={txt('Chat விருப்பங்கள்', 'Chat options')}
              className="grid size-10 cursor-pointer list-none place-items-center rounded-full text-[#547268] transition hover:bg-[#edf4ef]"
            >
              <EllipsisVertical size={20} />
            </summary>
            <div className="absolute right-0 top-full mt-3 w-64 rounded-[20px] border border-[#e3ebe5] bg-white p-2 shadow-[0_12px_50px_#153c3025]">
              {me && (
                <p className="border-b border-[#edf2ed] px-3 py-3 text-xs text-[#6a8179]">
                  {txt('உங்கள் பெயர்', 'Chatting as')}{' '}
                  <strong className="break-words text-[#244e41]">
                    {me.name}
                  </strong>
                </p>
              )}
              {room &&
                status !== 'ended' &&
                status !== 'declined' &&
                (room.host_id === meId ? (
                  <DestroyChatButton
                    roomId={roomId}
                    tamil={tamil}
                    disabled={busy}
                    kind={room.source === 'link' ? 'link' : 'chat'}
                    className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                    onDestroyed={async () => {
                      inviteRef.current = '';
                      setInviteToken('');
                      setInvitation(null);
                      setImage(null);
                      setDraft('');
                      window.history.replaceState(
                        null,
                        '',
                        window.location.pathname,
                      );
                      await load();
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (actionsMenu.current) actionsMenu.current.open = false;
                      setConfirm('end');
                    }}
                    className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold hover:bg-[#edf4ef]"
                  >
                    {txt('Chat-ஐ முடி', 'End conversation')}
                  </button>
                ))}
              {room?.peer_id && status === 'active' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (actionsMenu.current) actionsMenu.current.open = false;
                    setConfirm('block');
                  }}
                  className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  {txt('இந்த நபரை Block செய்', 'Block this person')}
                </button>
              )}
              {status === 'active' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (actionsMenu.current) actionsMenu.current.open = false;
                    setReportPicker(true);
                  }}
                  className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  Report chat
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (actionsMenu.current) actionsMenu.current.open = false;
                  setShowThemes(true);
                }}
                className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold hover:bg-[#edf4ef]"
              >
                Change theme
              </button>
              <a
                href="/community-chat/rules"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#5a786b] hover:bg-[#edf4ef]"
              >
                <ShieldCheck size={15} aria-hidden="true" />
                Privacy & limits
              </a>
            </div>
          </details>
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
              void act({
                action: 'join',
                name: nickname,
                accepted: agreed,
                archiveConsent: agreed,
              });
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
            <label
              lang="en"
              translate="no"
              className="mt-5 flex gap-3 text-[8px] leading-4"
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
                className="mt-1 size-4 shrink-0 accent-[#225343]"
              />
              <span>
                I agree to chat respectfully. I have read that messages, smaller
                image copies, nicknames and timestamps are retained in an
                admin-only security PDF for 30 days after a new chat ends. This
                is not end-to-end encrypted chat.{' '}
                <Link href="/community-chat/rules" className="underline">
                  Chat rules
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
              {status === 'ended' || status === 'declined' ? (
                <span lang="en" translate="no" className="text-xs leading-6">
                  Pictures are no longer available in this chat. For new chats,
                  the disclosed 30-day security archive still applies.
                </span>
              ) : (
                txt(
                  'இருவரும் ஒப்புக்கொண்ட பிறகே படங்களையும் செய்திகளையும் பகிர முடியும்.',
                  'Messages and images can be shared only after both people agree.',
                )
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
                <p className="mb-3 text-xs leading-6 text-[#60776c]">
                  {txt(
                    'நண்பர் ஏற்றதும் link செயலிழக்கும். ⋯ menu-வில் “Link-ஐ அழி” மூலம் எப்போது வேண்டுமானாலும் ரத்து செய்யலாம்.',
                    'The link is single-use. Open ⋯ → Destroy link to cancel it whenever you want.',
                  )}
                </p>
                <input
                  readOnly
                  ref={invitationInput}
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
                {copyFeedback && (
                  <output
                    aria-live="polite"
                    className={`mt-3 block rounded-xl px-3 py-2 text-xs font-semibold ${copied ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}
                  >
                    {copyFeedback}
                  </output>
                )}
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
            ref={thread}
            role="log"
            aria-label="Conversation messages"
            aria-live="polite"
            aria-relevant="additions text"
            className="messenger-thread min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-5 sm:px-8 sm:py-7"
          >
            {!chatMessages.length && (
              <div className="mx-auto my-12 max-w-xs rounded-[24px] bg-white/65 px-6 py-7 text-center">
                <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#e0efe3] text-[#258272]">
                  <MessageCircle size={23} aria-hidden="true" />
                </span>
                <p className="text-sm font-bold text-[#31594b]">
                  {txt(
                    'ஒரு வணக்கத்தில் தொடங்கட்டும் ✨',
                    'Good conversations start with hello ✨',
                  )}
                </p>
                <p className="mt-2 text-xs leading-7 text-[#799083]">
                  {txt(
                    'ஒரு செய்தி அல்லது ஒரு படம். உங்கள் உரையாடல், உங்கள் ஸ்டைல்.',
                    'A message or a picture. Your conversation, your style.',
                  )}
                </p>
              </div>
            )}
            {chatMessages.map((message, index) => {
              const mine = message.sender_id === meId;
              const seen = mine && !!message.seen;
              const sticker = !message.has_image
                ? findChatSticker(message.body)
                : undefined;
              const date = new Date(message.created_at);
              const newDay =
                index === 0 ||
                date.toDateString() !==
                  new Date(chatMessages[index - 1].created_at).toDateString();
              const day =
                date.toDateString() === new Date().toDateString()
                  ? txt('இன்று', 'Today')
                  : date.toLocaleDateString(tamil ? 'ta-IN' : 'en-IN', {
                      day: 'numeric',
                      month: 'short',
                    });
              return (
                <div key={message.id}>
                  {newDay && (
                    <div className="mb-5 mt-2 text-center">
                      <time
                        dateTime={message.created_at}
                        className="inline-block rounded-full border border-[#e0e8dc] bg-white/80 px-4 py-1 text-[10px] font-semibold text-[#7a8b7d] shadow-sm"
                      >
                        {day}
                      </time>
                    </div>
                  )}
                  <div
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <MessagePressable onOpen={() => setActionMessage(message)}>
                      <div
                        data-mine={mine}
                        className={`messenger-bubble overflow-hidden rounded-[20px] ${mine ? 'rounded-br-[5px] bg-[#d9f4e2] text-[#1b473b]' : 'rounded-bl-[5px] bg-white text-[#28473f]'}`}
                      >
                        {message.reply && (
                          <div className="mx-1.5 mt-1.5 max-w-full rounded-xl border-l-[3px] border-[#479b79] bg-black/[0.04] px-3 py-2 text-xs">
                            <strong className="block text-[10px] text-[#317257]">
                              {message.reply.sender_id === meId
                                ? 'You'
                                : (room?.peer_name ?? 'Your friend')}
                            </strong>
                            <span className="line-clamp-2 break-words">
                              {message.reply.has_image ? '📷 ' : ''}
                              {message.reply.preview}
                            </span>
                          </div>
                        )}
                        {message.has_image && (
                          <div className="p-1.5 pb-0">
                            <ChatImage
                              id={message.id}
                              onOpen={setViewPhoto}
                              tamil={tamil}
                            />
                          </div>
                        )}
                        {sticker && (
                          <div className="p-1.5">
                            <ChatStickerCard sticker={sticker} />
                          </div>
                        )}
                        <div className="flow-root px-3 py-2">
                          {!sticker &&
                            (!message.has_image ||
                              message.body !== '📷 Shared image') && (
                              <span
                                className={
                                  !message.has_image &&
                                  isSingleEmoji(message.body)
                                    ? 'messenger-single-emoji'
                                    : 'whitespace-pre-wrap break-words text-[14px] leading-[1.55] [overflow-wrap:anywhere]'
                                }
                              >
                                <ChatMessageBody
                                  text={message.body}
                                  onOpenPhoto={setViewPhoto}
                                />
                              </span>
                            )}
                          <span className="float-right ml-2 mt-1 inline-flex h-3 items-center gap-0.5 whitespace-nowrap text-[8px] leading-3 text-[#607767]">
                            <time dateTime={message.created_at}>
                              {date.toLocaleTimeString(
                                tamil ? 'ta-IN' : 'en-IN',
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </time>
                            {mine &&
                              (seen ? (
                                <CheckCheck
                                  size={12}
                                  className="text-sky-600"
                                  aria-label="Seen"
                                >
                                  <title>
                                    Seen on the recipient’s chat screen
                                  </title>
                                </CheckCheck>
                              ) : (
                                <Check size={10} aria-label="Sent" />
                              ))}
                          </span>
                        </div>
                      </div>
                      {!!message.reactions?.length && (
                        <div
                          className={`mt-0.5 flex gap-1 ${mine ? 'justify-end' : ''}`}
                        >
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.emoji}
                              type="button"
                              disabled={busy || !connected}
                              aria-label={`${reaction.emoji}, ${reaction.count} reaction${reaction.count > 1 ? 's' : ''}${reaction.mine ? ', yours' : ''}`}
                              onClick={() =>
                                void reactTo(message, reaction.emoji)
                              }
                              className={`min-h-7 rounded-full border px-2 text-xs ${reaction.mine ? 'border-[#64aa88] bg-[#dbf2e3]' : 'border-[#d9e6dd] bg-white'}`}
                            >
                              {reaction.emoji}
                              {reaction.count > 1 ? ` ${reaction.count}` : ''}
                            </button>
                          ))}
                        </div>
                      )}
                      {!mine && (
                        <span
                          data-read-message={message.id}
                          className="block h-px"
                          aria-hidden="true"
                        />
                      )}
                    </MessagePressable>
                  </div>
                </div>
              );
            })}
            <div ref={bottom} />
          </div>
          {showGames && meId && (
            <ChatGames
              key={state.game?.id ?? 'picker'}
              roomId={roomId}
              game={state.game ?? null}
              meId={meId}
              peerName={room?.peer_name ?? 'Your friend'}
              connected={connected}
              onRefresh={load}
              onClose={() => setShowGames(false)}
            />
          )}
          <form
            onSubmit={(event) => void send(event)}
            className="messenger-composer relative shrink-0 border-t border-[#e3ece5] bg-white px-2 pb-2 pt-2 sm:px-6"
          >
            {showStickers && (
              <ChatStickerPicker
                busy={busy || !connected}
                tamil={tamil}
                onSend={(sticker) => void sendSticker(sticker)}
                onClose={() => setShowStickers(false)}
                onEmoji={(emoji) => {
                  setDraft((current) => current + emoji);
                  setShowStickers(false);
                  composer.current?.focus();
                }}
                onGames={() => {
                  setShowStickers(false);
                  setShowGames(true);
                }}
              />
            )}
            {preview && (
              <div className="mb-3 flex items-start gap-3 rounded-xl bg-[#f0f5eb] p-3">
                {/* A local object URL preview; it is revoked on remove, send, chat end or unmount. */}
                {/* oxlint-disable-next-line */}
                <img
                  src={preview}
                  alt="Selected attachment preview"
                  className={
                    cameraMotion
                      ? 'h-28 w-36 rounded-lg object-cover object-top'
                      : 'max-h-32 max-w-40 rounded-lg object-contain'
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {txt('பகிரத் தயாராக உள்ளது', 'Ready to share')}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-[#60776c]">
                    {cameraMotion ? '5-second GIF' : 'Optimized'} ·{' '}
                    {Math.ceil((image?.size ?? 0) / 1024)} KB
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
            {processingImage && (
              <output className="mb-2 flex items-center gap-2 text-xs text-[#527568]">
                <LoaderCircle size={14} className="animate-spin" />
                Optimizing photo…
              </output>
            )}
            {replyTo && (
              <div className="mb-2 flex min-w-0 items-center gap-2 rounded-xl border-l-[3px] border-[#4a9c78] bg-[#edf5ef] px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#347354]">
                    Replying to{' '}
                    {replyTo.sender_id === meId
                      ? 'yourself'
                      : (room?.peer_name ?? 'your friend')}
                  </p>
                  <p className="truncate text-xs">
                    {replyTo.has_image ? '📷 ' : ''}
                    {chatStickerPreview(replyTo.body)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Cancel reply"
                  onClick={() => setReplyTo(null)}
                  className="grid size-9 shrink-0 place-items-center"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <ChatAttachmentMenu
                disabled={busy || processingImage || !connected}
                onPhoto={() => fileInput.current?.click()}
                onCamera={() => {
                  setShowCamera(true);
                  setShowStickers(false);
                  setShowGames(false);
                }}
                onDraw={() => {
                  setShowDrawing(true);
                  setShowStickers(false);
                  setShowGames(false);
                }}
                onStickers={() => {
                  setShowStickers((value) => !value);
                  setShowGames(false);
                }}
                onGames={() => {
                  setShowGames((value) => !value);
                  setShowStickers(false);
                }}
              />
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose image to share"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  void chooseImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <label htmlFor="private-message" className="sr-only">
                {txt('உங்கள் செய்தி', 'Your message')}
              </label>
              <textarea
                ref={composer}
                id="private-message"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = '48px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing &&
                    window.matchMedia('(pointer:fine)').matches
                  ) {
                    event.preventDefault();
                    void send(event);
                  }
                }}
                rows={1}
                maxLength={replyTo ? REPLY_TEXT_LIMIT : 1200}
                disabled={busy}
                placeholder={
                  image
                    ? txt('விருப்பமான விளக்கம்…', 'Add a caption…')
                    : txt('செய்தியை எழுதுங்கள்…', 'Write a message…')
                }
                className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-[24px] border border-transparent bg-[#f1f5f3] px-4 py-3 text-base leading-6 sm:text-sm placeholder:text-[#667b6d] focus:border-[#81bba2] focus:outline-none focus:ring-2 focus:ring-[#d9eee2]"
              />
              <button
                type="submit"
                disabled={
                  busy ||
                  processingImage ||
                  (!draft.trim() && !image) ||
                  !connected
                }
                aria-label={txt('அனுப்பு', 'Send')}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[#148675] text-white shadow-[0_4px_14px_#14867530] transition hover:bg-[#106e60] disabled:opacity-30 disabled:shadow-none sm:size-12"
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </form>
        </>
      )}
      {showCamera && status === 'active' && (
        <ChatCamera
          onClose={() => setShowCamera(false)}
          onUse={(file, motion) => {
            imageJob.current++;
            setImage(file);
            setCameraMotion(motion);
            setShowCamera(false);
          }}
        />
      )}
      {showThemes && (
        <ChatThemePicker
          theme={theme}
          onChange={changeTheme}
          onClose={() => setShowThemes(false)}
        />
      )}
      {showDrawing && status === 'active' && (
        <ChatDrawing
          initialImage={cameraMotion ? null : image}
          onClose={() => setShowDrawing(false)}
          onSend={(file) => {
            setShowDrawing(false);
            void send({ preventDefault() {} }, file);
          }}
        />
      )}
      {actionMessage && status === 'active' && (
        <ChatActionDialog
          message={actionMessage}
          busy={busy}
          onClose={() => setActionMessage(null)}
          onReply={() => {
            setReplyTo(actionMessage);
            setDraft((current) =>
              Array.from(current).slice(0, REPLY_TEXT_LIMIT).join(''),
            );
            setActionMessage(null);
            composer.current?.focus();
          }}
          onReact={(emoji) => void reactTo(actionMessage, emoji)}
        />
      )}
      {reportPicker && status === 'active' && (
        <ChatReportPicker
          messages={chatMessages.filter(
            (message) => message.sender_id !== meId,
          )}
          onClose={() => setReportPicker(false)}
          onChoose={(message) => {
            setReportPicker(false);
            setReport(message);
            setReason('');
          }}
        />
      )}
      {viewPhoto && status === 'active' && (
        <ChatPhotoViewer
          key={viewPhoto}
          messageId={viewPhoto}
          tamil={tamil}
          onClose={() => setViewPhoto(null)}
        />
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
            <span lang="en" translate="no" className="text-xs leading-6">
              Shared images will disappear from the chat. New chats retain a
              restricted PDF with smaller image copies for 30 days. Neither
              person can send further messages here.
            </span>
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
              {txt('இந்தச் செய்தியைப் புகாரளி', 'Report this message')}
            </h2>
            <blockquote className="mt-3 rounded-xl bg-[#f1f5f2] p-3 text-xs leading-6">
              <p className="text-[10px] text-[#607767]">
                {report.has_image ? 'Image attachment · ' : ''}
                {new Date(report.created_at).toLocaleString(
                  tamil ? 'ta-IN' : 'en-IN',
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words">
                {Array.from(report.body).slice(0, 220).join('')}
                {Array.from(report.body).length > 220 ? '…' : ''}
              </p>
            </blockquote>
            <p className="mt-3 text-xs leading-6">
              <span lang="en" translate="no" className="text-xs leading-6">
                A moderator can review this report. New chats also retain
                messages and smaller image copies in a restricted security PDF
                for 30 days after ending.
              </span>
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
