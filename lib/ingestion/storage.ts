import { readFileSync, statSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IngestionState, NormalizedSnapshot } from '@/types/civic';
import { hashContent } from './core';
import { assert } from './validate';

const root = path.join(process.cwd(),'data','normalized');
const cache = new Map<string,{stamp:string;data:NormalizedSnapshot}>();
export function readPublished(source: 'sansad'|'mplads'): NormalizedSnapshot | null {
  try {
    const file=path.join(root,`${source}.json`), stat=statSync(file), stamp=`${stat.mtimeMs}:${stat.size}`;
    if(cache.get(source)?.stamp===stamp) return cache.get(source)!.data;
    const envelope = JSON.parse(readFileSync(file,'utf8'));
    assert(envelope.sha256===hashContent(JSON.stringify(envelope.data)), 'Normalized snapshot checksum mismatch');
    const data = envelope.data as NormalizedSnapshot;
    assert(data.version===1 && data.representativeId==='ls18-mh-mumbai-north-west' && Array.isArray(data.sources), 'Invalid normalized snapshot');
    assert(data.sourceIdentifier===(source==='sansad'?'5701':'3042793'), 'Snapshot identity mismatch');
    cache.set(source,{stamp,data}); return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code!=='ENOENT') console.error(`Cannot load ${source} snapshot:`, error);
    return null;
  }
}
export function readState(source: 'sansad'|'mplads'): IngestionState | undefined {
  try { return JSON.parse(readFileSync(path.join(root,`${source}.status.json`),'utf8')); }
  catch { return undefined; }
}
async function atomic(file:string, data:unknown) {
  await mkdir(root,{recursive:true});
  const target = path.join(root,file), tmp = `${target}.${process.pid}.tmp`;
  await writeFile(tmp,JSON.stringify(data,null,2)+'\n');
  await rename(tmp,target);
}
export async function publish(source:'sansad'|'mplads', data:NormalizedSnapshot) {
  const envelope={sha256:hashContent(JSON.stringify(data)),data};
  await atomic(`${source}-${envelope.sha256}.json`,envelope);
  await atomic(`${source}.json`,envelope);
  await atomic(`${source}.status.json`,data.state);
}
export async function writeState(source:'sansad'|'mplads', state:IngestionState) {
  await atomic(`${source}.status.json`,state);
}
