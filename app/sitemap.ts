import type { MetadataRoute } from 'next';
import { listWorks, workId } from '@/lib/works';
export const dynamic = 'force-dynamic';

const origin = 'https://knowyourmp.abhinandantejaswi.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ['/', '/methodology', '/site-use', '/privacy', '/mp/mumbai-north-west', '/constituency/mumbai-north-west', '/works'].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: path === '/methodology' || path === '/site-use' || path === '/privacy' ? 'yearly' : 'weekly',
    priority: path === '/' ? 1 : path === '/mp/mumbai-north-west' ? 0.9 : 0.6,
  }));
  const works = await listWorks();
  return [...pages, ...works.map((work) => ({
    url: `${origin}/works/${workId(work.id)}`,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))];
}
