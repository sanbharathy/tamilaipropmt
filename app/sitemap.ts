import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tamilaiprompt.com',
      lastModified: new Date('2026-09-14'),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
