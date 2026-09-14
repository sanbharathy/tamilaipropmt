import type { Metadata } from 'next';

import { HashtagLibrary } from '@/components/hashtag-library';

export const metadata: Metadata = {
  title: 'Trending Hashtags for Instagram, TikTok & Social Media',
  description:
    'Copy 30 Tamil creator hashtag sets for Instagram, TikTok, YouTube Shorts, Facebook, LinkedIn and X. Includes AI image, AI video, business, festival and education hashtags.',
  alternates: { canonical: '/hashtags' },
  openGraph: {
    title: 'Trending Hashtags for Tamil Creators',
    description:
      '30 copy-ready hashtag sets for Tamil AI prompts, reels, business posts, festivals, education and creator content.',
    url: 'https://tamilaiprompt.com/hashtags',
    type: 'website',
    siteName: 'TamilAI Prompt',
    locale: 'ta_IN',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'TamilAI Prompt hashtag library' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trending Hashtags for Tamil Creators',
    description: 'Copy 30 hashtag sets for Instagram, TikTok, YouTube Shorts and social media.',
    images: ['/og.jpg'],
  },
};

export default function HashtagsPage() {
  return <HashtagLibrary />;
}
