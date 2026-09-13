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
  title: 'TamilAI Prompt — தமிழில் சிறந்த AI Prompts',
  description: 'வேலை, கல்வி, படங்கள் மற்றும் கோடிங்கிற்கான தரமான AI prompts தமிழில்.',
  openGraph: {
    title: 'TamilAI Prompt — சரியான Prompt. சிறந்த முடிவு.',
    description: 'Discover high-quality Tamil AI prompts for work, learning, images, and coding.',
    type: 'website',
    locale: 'ta_IN',
    url: 'https://tamilaiprompt.com',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'TamilAI Prompt' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TamilAI Prompt',
    description: 'AI prompts in Tamil, made simple for everyone.',
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
