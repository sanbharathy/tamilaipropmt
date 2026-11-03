import type { ChatGame } from './chat-games';
import type {
  ChatReply,
  ChatReaction,
  ChatReactionEvent,
} from './chat-interactions';
export const chatTopics = [
  { id: 'ai', ta: 'AI & Prompts', en: 'AI & prompts' },
  { id: 'photos', ta: 'படங்கள் & Design', en: 'Photos & design' },
  { id: 'social', ta: 'Reels & Social', en: 'Reels & social' },
] as const;
export type ChatSession = {
  id: string;
  name: string;
  available: boolean;
  topic: string;
  archive_notice?: boolean;
};
export type ChatRoom = {
  id: string;
  host_id: string;
  guest_id: string | null;
  status: 'pending' | 'active' | 'ended' | 'declined';
  source: 'link' | 'directory';
  peer_name: string | null;
  peer_id: string | null;
  peer_last_seen?: string | null;
  peer_read_id?: string;
  peer_read_at?: string | null;
  peer_viewing?: boolean;
  peer_active_until?: string | null;
  expires_at: string;
  created_at: string;
};
export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  has_image?: boolean;
  seen?: boolean;
  game_event?: boolean;
  reply?: ChatReply;
  reactions?: ChatReaction[];
  reaction_event?: boolean;
  created_at: string;
};
export type ChatState = {
  me: ChatSession | null;
  rooms: ChatRoom[];
  people: Pick<ChatSession, 'id' | 'name' | 'topic'>[];
  messages: ChatMessage[];
  room: ChatRoom | null;
  game?: ChatGame | null;
  reaction_events?: ChatReactionEvent[];
  server_time?: string;
};
