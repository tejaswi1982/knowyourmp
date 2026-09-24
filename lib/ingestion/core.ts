import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { SnapshotManifest } from '@/types/civic';

/**
 * Shared ingestion plumbing.
 *
 * Node-only. Nothing here may be imported from a component or a route handler:
 * this code runs on a schedule, writes snapshots to disk, and is allowed to be
 * slow and to fail loudly.
 */

/**
 * Thrown when an adapter is called before its endpoint research is complete.
 *
 * Deliberately an error rather than a null or an empty array. A half-built
 * adapter that returns `[]` looks exactly like a member who asked no questions,
 * and that difference is the entire point of the project.
 */
export class NotConnectedError extends Error {
  constructor(adapter: string, detail: string) {
    super(`${adapter} is not connected yet. ${detail}`);
    this.name = 'NotConnectedError';
  }
}

/** Thrown when a payload arrives but does not match what the parser expects. */
export class ValidationError extends Error {
  constructor(
    message: string,
    readonly manifest?: SnapshotManifest,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const RAW_ROOT = path.join(process.cwd(), 'data', 'raw');

export function hashContent(body: string | Buffer): string {
  return createHash('sha256').update(body).digest('hex');
}

/**
 * Fetch a URL and write the response body to `data/raw/<source>/` before any
 * parsing happens, returning the manifest that describes it.
 *
 * A polite, identifiable user agent is sent: these are public records and this
 * is a public-interest project, and anonymous scraping of a government portal
 * is both rude and a good way to get an IP blocked.
 */
export async function fetchSnapshot(options: {
  source: string;
  url: string;
  parserVersion: string;
  /** Filename stem within `data/raw/<source>/`. */
  key: string;
  init?: RequestInit;
  sourceIdentifier?: string;
}): Promise<{ manifest: SnapshotManifest; body: string }> {
  const { source, url, parserVersion, key, init } = options;

  const response = await fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(30000),
    headers: {
      'user-agent':
        'KnowYourMP/0.1 (public civic-data ingestion)',
      ...(init?.headers ?? {}),
    },
  });

  const bytes = Buffer.from(await response.arrayBuffer());
  const body = bytes.toString('utf8');
  const retrievedAt = new Date().toISOString();
  const contentHash = hashContent(bytes);

  const dir = path.join(RAW_ROOT, source);
  await mkdir(dir, { recursive: true });

  // Hash in the filename: identical payloads collapse to one file, and a
  // changed payload never overwrites the snapshot that produced a live figure.
  if (!/^[a-zA-Z0-9_-]+$/.test(source) || !/^[a-zA-Z0-9_-]+$/.test(key)) throw new ValidationError('Unsafe snapshot path');
  const storedAt = path.join(dir, `${key}.${contentHash.slice(0, 12)}.${randomUUID()}.raw`);
  await writeFile(storedAt, bytes, { flag: 'wx' });

  const manifest: SnapshotManifest = {
    sourceUrl: url,
    sourceIdentifier: options.sourceIdentifier ?? key,
    method: init?.method ?? 'GET',
    requestBody: typeof init?.body === 'string' ? init.body : undefined,
    retrievedAt,
    parserVersion,
    contentHash,
    storedAt: path.relative(process.cwd(), storedAt),
    status: response.status,
    contentType: response.headers.get('content-type') ?? undefined,
  };

  await writeFile(`${storedAt}.manifest.json`, JSON.stringify(manifest, null, 2), 'utf8');

  if (!response.ok) {
    throw new ValidationError(`${source}: ${url} returned ${response.status}`, manifest);
  }

  return { manifest, body };
}

/**
 * Production storage note.
 *
 * `data/raw/` is retained evidence. Larger deployments can use object storage under
 * `raw/<source>/<yyyy-mm-dd>/<key>.<hash>`, with the manifest rows in the
 * database so a published figure can always be traced to the exact payload it
 * came from. Snapshots are immutable; corrections are new snapshots.
 */
export const RAW_STORAGE_NOTE = 'Retain raw bytes and manifests with every publication; see data/raw/README.md';
