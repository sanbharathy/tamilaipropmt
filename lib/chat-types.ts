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
  expires_at: string;
  created_at: string;
};
export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string;
  has_image?: boolean;
  created_at: string;
};
export type ChatState = {
  me: ChatSession | null;
  rooms: ChatRoom[];
  people: Pick<ChatSession, 'id' | 'name' | 'topic'>[];
  messages: ChatMessage[];
  room: ChatRoom | null;
};
