import type { Metadata } from 'next';
import { Noto_Sans_Tamil, Outfit } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const tamil = Noto_Sans_Tamil({
  variable: '--font-tamil',
  subsets: ['tamil'],
  display: 'swap',
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tamilaiprompt.com'),
  title: 'TamilAI Prompt - 40+ Tamil AI Prompts, Tips & AI Tools',
  description:
    'தமிழர்களுக்கான 40+ copy-ready AI prompts, AI tips and useful AI tool links. Trending image prompts, video prompts, business prompts, and creator ideas in Tamil.',
  applicationName: 'TamilAI Prompt',
  authors: [{ name: 'TamilAI Prompt' }],
  creator: 'TamilAI Prompt',
  publisher: 'TamilAI Prompt',
  keywords: [
    'Tamil AI prompts',
    'AI prompts Tamil',
    'Tamil image prompts',
    'Tamil video prompts',
    'ChatGPT image prompts Tamil',
    'Gemini prompts Tamil',
    'Veo prompts Tamil',
    'Midjourney prompts Tamil',
    '80s Tamil photo prompt',
    '90s saree AI photo prompt',
    'Nano Banana saree prompt',
    'Tamil creator prompts',
    'AI tips Tamil',
    'AI tools Tamil',
    'Kling AI Tamil prompts',
    'Midjourney Tamil prompts',
    'Instagram profile checker Tamil',
    'Instagram bio checker Tamil',
    'Tamil creator growth',
    'Tamil Instagram hashtags',
    'YouTube revenue calculator Tamil',
    'YouTube channel checker Tamil',
    'Tamil YouTube growth',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TamilAI Prompt - 40+ Tamil AI Prompts, Tips & Tools',
    description:
      'Copy-ready Tamil prompts, AI tips, and useful AI tool links for viral images, videos, business, and creator workflows.',
    type: 'website',
    locale: 'ta_IN',
    url: 'https://tamilaiprompt.com',
    siteName: 'TamilAI Prompt',
    images: [{ url: '/og.jpg', width: 800, height: 420, alt: 'TamilAI Prompt' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TamilAI Prompt - Tamil AI Prompts, Tips & Tools',
    description: '40+ trending AI prompts, practical AI tips, and useful AI tool links for Tamil creators.',
    images: ['/og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://tamilaiprompt.com/#organization',
      name: 'TamilAI Prompt',
      url: 'https://tamilaiprompt.com',
      logo: 'https://tamilaiprompt.com/og.jpg',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://tamilaiprompt.com/#website',
      name: 'TamilAI Prompt',
      url: 'https://tamilaiprompt.com',
      inLanguage: ['ta-IN', 'en'],
      publisher: { '@id': 'https://tamilaiprompt.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://tamilaiprompt.com/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://tamilaiprompt.com/#webpage',
      url: 'https://tamilaiprompt.com',
      name: 'TamilAI Prompt - 40+ Trending Tamil AI Image & Video Prompts',
      description:
        'A Tamil AI prompt library with copy-ready prompts, practical AI tips, and useful AI tool links for image generation, video generation, business, and creator workflows.',
      isPartOf: { '@id': 'https://tamilaiprompt.com/#website' },
      about: { '@id': 'https://tamilaiprompt.com/#organization' },
      inLanguage: 'ta-IN',
    },
    {
      '@type': 'ItemList',
      '@id': 'https://tamilaiprompt.com/#prompt-library',
      name: 'Tamil AI Prompt Library',
      itemListElement: [
        '80s Tamil cinema look',
        '90s saree shadow portrait',
        'Favorite actor-style AI poster',
        'Tamil temple wedding portrait',
        'Chennai night ride reel',
        'Tamil Nadu travel reel',
        'Product reveal video',
        'Tamil business captions',
        'AI prompt tips and tricks',
        'Instagram profile strength checker',
        'Tamil Instagram hashtag sets',
        'YouTube channel revenue checker',
        'Tamil YouTube growth ideas',
        'Kling AI',
        'Midjourney',
        'Runway',
      ].map((name, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
      })),
    },
  ],
};

const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ta">
      <head>
        {adsensePublisherId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${tamil.variable} ${outfit.variable} antialiased`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Analytics />
      </body>
    </html>
  );
}
