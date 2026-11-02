import type { Metadata } from 'next';
import { DiwaliStudio } from '@/components/diwali-studio';

export const metadata: Metadata = {
  title: 'Diwali Wishes in Tamil & AI Photo Prompts | TamilAI Prompt',
  description: 'Copy Tamil Deepavali wishes, welcome greetings and customer messages. Create personal Diwali photos with 8 Tamil and English AI image prompts for Gemini and ChatGPT.',
  alternates: { canonical: '/diwali-greetings' },
  openGraph: {
    title: 'தீபாவளி வாழ்த்துகள் & AI Photo Prompts',
    description: 'Personal photo prompts, Tamil wishes and warm welcome greetings for your Diwali.',
    url: '/diwali-greetings',
    images: [{ url: '/diwali-lamps.jpg', width: 1200, height: 800, alt: 'Illustrated Diwali lamps and festive flowers' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diwali Wishes in Tamil & AI Photo Prompts',
    description: '8 photo prompts and 12 personal Diwali greetings in Tamil and English.',
    images: ['/diwali-lamps.jpg'],
  },
};

export default function DiwaliPage() {
  return <DiwaliStudio />;
}
