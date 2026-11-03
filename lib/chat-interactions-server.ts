import { createHmac, timingSafeEqual } from 'node:crypto';
import { ChatError } from './chat-server';
import {
  REACTION_EMOJIS,
  REPLY_TEXT_LIMIT,
  type ChatReply,
} from './chat-interactions';
export const REPLY_PREFIX = '↪ TamilAI reply v1 ';
export const REACTION_PREFIX = '✨ TamilAI reaction v1 ';
function sign(payload: string, room: string, sender: string) {
  const key = process.env.CHAT_RATE_SALT;
  if (!key) throw new Error('Chat not configured');
  return createHmac('sha256', key)
    .update('chat-interaction-v1\n' + room + '\n' + sender + '\n' + payload)
    .digest('hex');
}
function encode(prefix: string, payload: string, room: string, sender: string) {
  const body = prefix + sign(payload, room, sender) + ' ' + payload;
  if (Array.from(body).length > 1200)
    throw new ChatError('This reply is too long. Please shorten it.', 413);
  return body;
}
function decode(prefix: string, body: string, room: string, sender: string) {
  if (!body.startsWith(prefix)) return null;
  const rest = body.slice(prefix.length),
    signature = rest.slice(0, 64),
    payload = rest.slice(65);
  if (
    rest[64] !== ' ' ||
    !/^[a-f0-9]{64}$/.test(signature) ||
    !timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(sign(payload, room, sender)),
    )
  )
    return null;
  return payload;
}
export function messageId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{1,19}$/.test(value) ||
    BigInt(value) < BigInt(1) ||
    BigInt(value) > BigInt('9223372036854775807')
  )
    throw new ChatError('Choose a valid message.');
  return value;
}
export function reservedInteraction(body: string) {
  return body.startsWith(REPLY_PREFIX) || body.startsWith(REACTION_PREFIX);
}
export function readReply(
  body: string,
  room: string,
  sender: string,
): { body: string; reply: ChatReply } | null {
  const payload = decode(REPLY_PREFIX, body, room, sender);
  if (payload === null) return null;
  const newline = payload.indexOf('\n');
  if (newline < 0) return null;
  try {
    const q = JSON.parse(payload.slice(0, newline));
    if (
      typeof q.id !== 'string' ||
      !/^\d{1,19}$/.test(q.id) ||
      typeof q.a !== 'string' ||
      typeof q.q !== 'string' ||
      typeof q.h !== 'boolean'
    )
      return null;
    return {
      body: payload.slice(newline + 1),
      reply: {
        id: q.id,
        sender_id: q.a,
        preview: q.q,
        has_image: q.h,
        available: true,
      },
    };
  } catch {
    return null;
  }
}
export function replyQuote(
  target: { id: string; sender_id: string; body: string; has_image: boolean },
  room: string,
): ChatReply {
  const original =
    readReply(target.body, room, target.sender_id)?.body ?? target.body;
  return {
    id: target.id,
    sender_id: target.sender_id,
    preview:
      target.has_image && original === '📷 Shared image'
        ? 'Image attachment'
        : Array.from(original.replace(/\s+/gu, ' ').trim())
            .slice(0, 80)
            .join(''),
    has_image: target.has_image,
    available: true,
  };
}
export function makeReply(
  body: string,
  reply: ChatReply,
  room: string,
  sender: string,
) {
  if (Array.from(body).length > REPLY_TEXT_LIMIT)
    throw new ChatError(
      `Replies can contain up to ${REPLY_TEXT_LIMIT} characters.`,
    );
  return encode(
    REPLY_PREFIX,
    JSON.stringify({
      id: reply.id,
      a: reply.sender_id,
      q: reply.preview,
      h: reply.has_image,
    }) +
      '\n' +
      body,
    room,
    sender,
  );
}
export function makeReaction(
  target: string,
  emoji: string,
  active: boolean,
  room: string,
  sender: string,
) {
  return encode(
    REACTION_PREFIX,
    JSON.stringify({ t: target, e: emoji, on: active }),
    room,
    sender,
  );
}
export function readReaction(
  body: string,
  room: string,
  sender: string,
): { target_id: string; emoji: string; active: boolean } | null {
  const payload = decode(REACTION_PREFIX, body, room, sender);
  if (payload === null) return null;
  try {
    const event = JSON.parse(payload);
    if (
      typeof event.t !== 'string' ||
      !/^\d{1,19}$/.test(event.t) ||
      !REACTION_EMOJIS.some((emoji) => emoji === event.e) ||
      typeof event.on !== 'boolean'
    )
      return null;
    return { target_id: event.t, emoji: event.e, active: event.on };
  } catch {
    return null;
  }
}
