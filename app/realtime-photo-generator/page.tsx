import type { Metadata } from 'next';

import { RealtimePhotoGenerator } from '@/components/realtime-photo-generator';

export const metadata: Metadata = {
  title: 'Realtime AI Photo Generator for Tamil Trends',
  description:
    'Generate realtime AI photos from TamilAI Prompt ideas. Create social media thumbnails, reel covers, festival images, and Tamil trend photo drafts instantly.',
  alternates: { canonical: '/realtime-photo-generator' },
  openGraph: {
    title: 'Realtime AI Photo Generator for Tamil Trends',
    description:
      'Paste a TamilAI Prompt, choose a ratio, and create instant AI photo previews for Instagram, YouTube Shorts, and Tamil creator trends.',
    url: 'https://tamilaiprompt.com/realtime-photo-generator',
    type: 'website',
    siteName: 'TamilAI Prompt',
    locale: 'ta_IN',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'TamilAI Prompt realtime AI photo generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Realtime AI Photo Generator for Tamil Trends',
    description: 'Create instant AI photo previews from Tamil trend prompts.',
    images: ['/og.jpg'],
  },
};

export default function RealtimePhotoGeneratorPage() {
  return <RealtimePhotoGenerator />;
}
