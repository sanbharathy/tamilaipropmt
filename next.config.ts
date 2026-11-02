import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/chat': ['./assets/chat-pdf/**', './public/chat-stickers/**'],
    '/api/chat/**': ['./assets/chat-pdf/**', './public/chat-stickers/**'],
  },
  images: {
    // Only public artwork can enter the shared image cache. Private chat API
    // URLs must never be fetched or cached by the image optimizer.
    localPatterns: [
      { pathname: '/trends/**' },
      { pathname: '/diwali-lamps.svg' },
      { pathname: '/diwali-lamps.jpg' },
      { pathname: '/og.jpg' },
      { pathname: '/og.png' },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
      },
    ],
  },
};

export default nextConfig;
