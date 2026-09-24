import type { MetadataRoute } from 'next';

const origin = 'https://knowyourmp.abhinandantejaswi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] }],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
