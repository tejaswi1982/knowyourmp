// Research only: retain observed official pages/bundles; never publishes civic records.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = 'data/research';
await mkdir(root, { recursive: true });
for (const url of process.argv.slice(2)) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash('sha256').update(bytes).digest('hex');
    const file = `${root}/${new URL(url).hostname}-${hash.slice(0, 12)}`;
    await writeFile(file, bytes);
    await writeFile(`${file}.json`, JSON.stringify({ url, finalUrl: response.url, status: response.status, retrievedAt: new Date().toISOString(), hash, contentType: response.headers.get('content-type') }, null, 2));
    const body = bytes.toString();
    console.log(JSON.stringify({ url, status: response.status, file, bytes: bytes.length, links: [...body.matchAll(/(?:src|href)=["']([^"']+)/g)].map(m => m[1]).filter(s => !s.startsWith('data:')).slice(0, 120) }));
  } catch (error) { console.error(url, error.message, error.cause?.code); process.exitCode = 1; }
}
