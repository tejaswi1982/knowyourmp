import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AuthorityResponse, Contribution, ModerationStatus } from './model';
import { publicContribution } from './model';

type Statement = { run(...args: (string | number)[]): unknown; get(...args: (string | number)[]): unknown; all(...args: (string | number)[]): unknown[] };
type Database = { exec(sql: string): void; prepare(sql: string): Statement };
export const storageRoot = () => process.env.CIVIC_STORAGE_DIR || path.join(process.cwd(), 'data', 'participation');
let database: Database | undefined;
let databasePath = '';
export function db() {
  const root = storageRoot();
  if (!database || databasePath !== root) {
    mkdirSync(root, { recursive: true });
    database = new DatabaseSync(path.join(root, 'civic.sqlite'));
    databasePath = root;
    database.exec(readFileSync(path.join(process.cwd(), 'lib/contributions/schema.sql'), 'utf8'));
  }
  return database;
}
export function contributions(workId?: string): Contribution[] {
  const rows = workId ? db().prepare('SELECT payload FROM contributions WHERE work_id = ? ORDER BY created_at DESC').all(workId) : db().prepare('SELECT payload FROM contributions ORDER BY created_at DESC').all();
  return rows.map(r => JSON.parse((r as { payload: string }).payload));
}
export function published(workId: string) {
  return contributions(workId).filter(c => c.moderationStatus === 'published' && c.visibilityStatus === 'public').map(publicContribution);
}
export function insertContribution(c: Contribution, requestId: string) {
  db().prepare('INSERT INTO contributions (id, work_id, session_id, request_id, created_at, payload) VALUES (?, ?, ?, ?, ?, ?)').run(c.id, c.workId, c.sessionId, requestId, c.createdAt, JSON.stringify(c));
}
export function priorSubmission(session: string, requestId: string) {
  return db().prepare('SELECT id FROM contributions WHERE session_id = ? AND request_id = ?').get(session, requestId) as { id: string } | undefined;
}
export function moderate(id: string, status: ModerationStatus, sourceChecked: boolean) {
  const row = db().prepare('SELECT payload FROM contributions WHERE id = ?').get(id) as { payload: string } | undefined;
  if (!row) throw new Error('Contribution not found.');
  const c: Contribution = JSON.parse(row.payload);
  if (c.kind === 'document' && status === 'published' && !sourceChecked) throw new Error('Check the source and document before publishing supporting evidence.');
  c.moderationStatus = status;
  c.visibilityStatus = status === 'published' ? 'public' : 'private';
  c.verificationState = c.kind === 'document' && status === 'published' ? 'source_checked' : 'unverified';
  c.updatedAt = new Date().toISOString();
  db().exec('BEGIN IMMEDIATE');
  try {
    db().prepare('UPDATE contributions SET payload = ? WHERE id = ?').run(JSON.stringify(c), id);
    db().prepare('INSERT INTO moderation_events (contribution_id, status, created_at) VALUES (?, ?, ?)').run(id, status, c.updatedAt);
    db().exec('COMMIT');
  } catch (e) { db().exec('ROLLBACK'); throw e; }
}
export function rateLimit(key: string, limit: number) {
  const bucket = Math.floor(Date.now() / 3600000);
  const result = db().prepare('INSERT INTO rate_limits (key, bucket, count) VALUES (?, ?, 1) ON CONFLICT(key,bucket) DO UPDATE SET count=count+1 RETURNING count').get(key, bucket) as { count: number };
  db().prepare('DELETE FROM rate_limits WHERE bucket < ?').run(bucket - 24);
  if (result.count > limit) throw new Error('Submission limit reached. Please try again in an hour.');
}
export function responses(workId: string): AuthorityResponse[] {
  return db().prepare('SELECT payload FROM authority_responses WHERE work_id = ?').all(workId)
    .map(r => JSON.parse((r as { payload: string }).payload) as AuthorityResponse)
    .filter(r => r.visibilityStatus === 'public' && r.verificationState === 'identity_verified');
}
