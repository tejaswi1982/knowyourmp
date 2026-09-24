import { getProfile } from './repository';

export const workId = (id: string) => id.replace(/^mplads:/, '');
export async function listWorks() {
  return (await getProfile('mumbai-north-west'))?.projects.filter(p => p.availability === 'published') ?? [];
}
export async function getWork(id: string) {
  if (!/^\d{1,12}$/.test(id)) return null;
  return (await listWorks()).find(p => workId(p.id) === id) ?? null;
}
