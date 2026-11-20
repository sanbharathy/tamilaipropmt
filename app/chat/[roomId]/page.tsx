import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrivateChat } from '@/components/private-chat';

export const metadata: Metadata = {
  title: 'Private Conversation | TamilAI Prompt',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default async function PrivateChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { roomId } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      roomId,
    )
  )
    notFound();
  const { from } = await searchParams;
  return (
    <PrivateChat
      key={roomId}
      roomId={roomId}
      returnTo={from === 'taie' ? '/taie-contact' : '/community-chat'}
    />
  );
}
