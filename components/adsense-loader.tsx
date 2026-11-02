'use client';

import { usePathname } from 'next/navigation';

export function AdsenseLoader({ publisherId }: { publisherId: string }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/chat/') || pathname?.startsWith('/community-chat'))
    return null;
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
    />
  );
}
