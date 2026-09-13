import type { Metadata } from 'next';
import { Noto_Sans_Tamil, Outfit } from 'next/font/google';
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
  title: 'TamilAI Prompt — தமிழர்களுக்கான Trending AI Prompts',
  description: 'வைரல் படங்கள், வீடியோக்கள் மற்றும் பல துறைகளுக்கான trending AI prompts — அனைத்தும் தமிழில்.',
  openGraph: {
    title: 'TamilAI Prompt — ட்ரெண்ட் ஆகும் முன்பே உருவாக்குங்கள்',
    description: 'Copy-ready Tamil prompts for viral images, videos, and useful everyday work.',
    type: 'website',
    locale: 'ta_IN',
    url: 'https://tamilaiprompt.com',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'TamilAI Prompt' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TamilAI Prompt',
    description: 'Trending AI image and video prompts for Tamil creators.',
    images: ['/og.png'],
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ta">
      <body className={`${tamil.variable} ${outfit.variable} antialiased`}>{children}</body>
    </html>
  );
}
