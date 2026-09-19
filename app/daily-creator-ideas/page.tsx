import type { Metadata } from 'next';

import { DailyCreatorIdeas } from '@/components/daily-creator-ideas';

export const metadata: Metadata = {
  title: 'Daily Tamil Creator Ideas, Captions, Prompts & Hashtags',
  description:
    'Check daily Tamil creator ideas with AI image prompts, reel hooks, captions, hashtags, weather content angles, festival hooks and INR exchange-rate content ideas.',
  alternates: { canonical: '/daily-creator-ideas' },
  openGraph: {
    title: 'Daily Tamil Creator Ideas',
    description:
      'A daily creator dashboard for Tamil Instagram, YouTube Shorts and AI content ideas with copy-ready prompts, captions and hashtags.',
    url: 'https://tamilaiprompt.com/daily-creator-ideas',
    type: 'website',
    siteName: 'TamilAI Prompt',
    locale: 'ta_IN',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'Daily Tamil creator ideas' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Tamil Creator Ideas',
    description: 'Copy today’s Tamil creator prompts, captions, hooks and hashtags.',
    images: ['/og.jpg'],
  },
};

export default function DailyCreatorIdeasPage() {
  return <DailyCreatorIdeas />;
}
