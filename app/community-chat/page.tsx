import type { Metadata } from 'next';
import { CommunityChat } from '@/components/community-chat';

export const metadata: Metadata = {
  title: 'Private Tamil Creator Chat | TamilAI Prompt',
  description:
    'Create a private chat link or opt in to meet Tamil AI creators. Two-person conversations with temporary image sharing, consent, reporting, and blocking.',
  alternates: { canonical: '/community-chat' },
  openGraph: {
    title: 'Tamil Creator Chat — Connect with a link',
    description: 'Private two-person conversations for Tamil AI creators.',
    url: '/community-chat',
  },
  robots: { index: false, follow: true },
};

export default function CommunityChatPage() {
  return <CommunityChat />;
}
