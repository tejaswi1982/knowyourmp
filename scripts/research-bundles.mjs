import { readFile, writeFile } from 'node:fs/promises';
const html = await readFile('data/research/sansad.in-b06e430fd731', 'utf8');
const urls = [...html.matchAll(/<script[^>]+src="([^"]+)/g)].map(m => new URL(m[1], 'https://sansad.in').href);
// Sequential requests, only scripts explicitly linked by the official page.
for (const url of urls.filter(u => !/polyfills|framework|main-|_app|webpack/.test(u))) {
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const text = await r.text();
  const name = url.split('/').pop();
  await writeFile(`data/research/bundle-${name}`, text);
  const hits = [...text.matchAll(/.{0,70}(?:https:\/\/sansad.in\/api|API_URL:|question\/|member\/|committee\/|bill\/).{0,300}/g)].map(m => m[0]);
  if (hits.length) console.log(name, hits.join('\n'));
}
