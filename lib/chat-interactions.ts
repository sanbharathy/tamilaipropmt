export const REACTION_EMOJIS = [
  '❤️',
  '😘',
  '😂',
  '👍',
  '😮',
  '😢',
  '🙌',
  '🔥',
] as const;
export const REPLY_TEXT_LIMIT = 850;
export type ChatReply = {
  id: string;
  sender_id: string;
  preview: string;
  has_image: boolean;
  available: boolean;
};
export type ChatReaction = { emoji: string; count: number; mine: boolean };
export type ChatReactionEvent = {
  id: string;
  target_id: string;
  actor_id: string;
  emoji: string;
  active: boolean;
  created_at: string;
};
export function loveEmoji(text: string): '❤️' | '😘' | null {
  const value = text.trim();
  return ['❤️', '❤', '💕', '💖'].includes(value)
    ? '❤️'
    : ['😘', '💋'].includes(value)
      ? '😘'
      : null;
}
