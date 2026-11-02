import type { Metadata } from 'next';
import { ChatModeration } from '@/components/chat-moderation';

export const metadata: Metadata = {
  title: 'Chat Moderation | TamilAI Prompt',
  robots: { index: false, follow: false },
};
export default function ModerationPage() {
  return <ChatModeration />;
}
