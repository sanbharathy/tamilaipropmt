'use client';
import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';
export function SiteAnalytics() {
  const path = usePathname();
  // Contact links contain a private credential in the URL fragment.
  if (
    path.startsWith('/taie-contact') ||
    path.startsWith('/chat/') ||
    path.startsWith('/community-chat')
  )
    return null;
  return <Analytics />;
}
