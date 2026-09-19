import type { MetadataRoute } from 'next';
import { promptLandingPages } from '@/lib/prompt-pages';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-09-14');

  return [
    { url: 'https://tamilaiprompt.com', lastModified, changeFrequency: 'daily', priority: 1 },
    { url: 'https://tamilaiprompt.com/about', lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://tamilaiprompt.com/daily-creator-ideas', lastModified, changeFrequency: 'daily', priority: 0.98 },
    { url: 'https://tamilaiprompt.com/hashtags', lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://tamilaiprompt.com/realtime-photo-generator', lastModified, changeFrequency: 'weekly', priority: 0.95 },
    { url: 'https://tamilaiprompt.com/instagram-profile-checker', lastModified, changeFrequency: 'weekly', priority: 0.95 },
    { url: 'https://tamilaiprompt.com/youtube-channel-checker', lastModified, changeFrequency: 'weekly', priority: 0.95 },
    { url: 'https://tamilaiprompt.com/contact', lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://tamilaiprompt.com/privacy', lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://tamilaiprompt.com/terms', lastModified, changeFrequency: 'yearly', priority: 0.5 },
    ...promptLandingPages.map((page) => ({
      url: `https://tamilaiprompt.com/prompts/${page.slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    })),
  ];
}
