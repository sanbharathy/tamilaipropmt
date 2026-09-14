import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://tamilaiprompt.com/sitemap.xml',
    host: 'https://tamilaiprompt.com',
  };
}
