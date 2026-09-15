import type { Metadata } from 'next';

import { YouTubeChannelChecker } from '@/components/youtube-channel-checker';

export const metadata: Metadata = {
  title: 'YouTube Channel Revenue & Strength Checker for Tamil Creators',
  description:
    'Estimate YouTube channel revenue and check channel strength instantly. Paste channel details to get monthly income range, SEO ideas, About rewrite, hashtags, and growth suggestions.',
  alternates: { canonical: '/youtube-channel-checker' },
  openGraph: {
    title: 'YouTube Channel Revenue & Strength Checker for Tamil Creators',
    description:
      'Live YouTube channel audit with revenue estimate, channel score, title ideas, hashtags, and creator-growth suggestions.',
    url: 'https://tamilaiprompt.com/youtube-channel-checker',
    type: 'website',
    siteName: 'TamilAI Prompt',
    locale: 'ta_IN',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'YouTube Channel Revenue Checker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Channel Revenue & Strength Checker for Tamil Creators',
    description: 'Estimate channel revenue and get YouTube growth suggestions for Tamil creators.',
    images: ['/og.jpg'],
  },
};

export default function YouTubeChannelCheckerPage() {
  return <YouTubeChannelChecker />;
}
