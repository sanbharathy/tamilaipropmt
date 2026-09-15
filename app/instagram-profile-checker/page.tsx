import type { Metadata } from 'next';

import { InstagramProfileChecker } from '@/components/instagram-profile-checker';

export const metadata: Metadata = {
  title: 'Instagram Profile Strength Checker for Tamil Creators',
  description:
    'Check your Instagram profile strength instantly. Paste your profile details and get a score, improved bio, reel ideas, hashtags, and growth suggestions for Tamil creators.',
  alternates: { canonical: '/instagram-profile-checker' },
  openGraph: {
    title: 'Instagram Profile Strength Checker for Tamil Creators',
    description:
      'Live Instagram profile audit tool with score, improved bio, reel ideas, hashtags, and creator-growth suggestions.',
    url: 'https://tamilaiprompt.com/instagram-profile-checker',
    type: 'website',
    siteName: 'TamilAI Prompt',
    locale: 'ta_IN',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'Instagram Profile Strength Checker' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Instagram Profile Strength Checker for Tamil Creators',
    description: 'Get a live profile score, bio rewrite, content ideas, and hashtag suggestions.',
    images: ['/og.jpg'],
  },
};

export default function InstagramProfileCheckerPage() {
  return <InstagramProfileChecker />;
}
