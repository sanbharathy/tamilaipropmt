import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date('2026-09-14');

  return [
    { url: 'https://tamilaiprompt.com', lastModified, changeFrequency: 'daily', priority: 1 },
    { url: 'https://tamilaiprompt.com/about', lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://tamilaiprompt.com/contact', lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://tamilaiprompt.com/privacy', lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: 'https://tamilaiprompt.com/terms', lastModified, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
