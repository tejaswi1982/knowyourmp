import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getWork } from '../works';
import { validateSubmission, type Contribution } from './model';
import { db, insertContribution, priorSubmission, rateLimit } from './store';
import { deleteMedia, saveMedia } from './media';

export function isAdmin(request: Request) {
  const secret = process.env.CIVIC_ADMIN_TOKEN;
  if (!secret || secret.length < 32) return false;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  return timingSafeEqual(createHash('sha256').update(secret).digest(), createHash('sha256').update(supplied).digest());
}
export function sameOrigin(request: Request) {
  // Next 14 may construct request.url with an internal localhost hostname.
  // The browser-controlled Origin must match the HTTP Host (not forwarded headers).
  // A reverse-proxy deployment should pin its external origin explicitly.
  const url = new URL(request.url);
  const expected = process.env.CIVIC_PUBLIC_ORIGIN || `${url.protocol}//${request.headers.get('host') || url.host}`;
  if (request.headers.get('origin') !== expected) throw new Error('Submit from this site.');
}
export function failure(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Request could not be completed.' }, { status, headers: { 'Cache-Control': 'no-store' } });
}
async function limitedForm(request: NextRequest) {
  const maximum = 16 * 1024 * 1024;
  if (Number(request.headers.get('content-length')) > maximum) throw new Error('Total upload is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Submission is empty.');
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > maximum) { await reader.cancel(); throw new Error('Total upload is too large.'); }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData();
}
export async function submit(request: NextRequest, workId: string, kind: Contribution['kind']) {
  const saved: string[] = [];
  try {
    sameOrigin(request);
    if (!await getWork(workId)) return failure(new Error('Work not found.'), 404);
    const cookie = request.cookies.get('civic_session')?.value;
    const sessionId = cookie && /^[a-f0-9-]{36}$/.test(cookie) ? cookie : randomUUID();
    rateLimit('global-submissions', 60); rateLimit('session:' + sessionId, 8);
    const form = await limitedForm(request);
    const requestId = String(form.get('requestId') ?? '');
    if (!/^[a-f0-9-]{36}$/.test(requestId)) throw new Error('Invalid submission token. Reload the form.');
    const prior = priorSubmission(sessionId, requestId);
    if (prior) return NextResponse.json({ id: prior.id, status: 'received' });
    const { files, ...values } = validateSubmission(form, kind);
    const id = randomUUID(); const now = new Date().toISOString();
    const media = [];
    for (const file of files) { const item = await saveMedia(file, kind); media.push(item); saved.push(item.storedFilename); }
    const c: Contribution = { ...values, id, workId, kind, sourceType: 'citizen', submittedAt: now,
      photoIds: media.map(m => m.id), sessionId, anonymousPublicly: true, moderationStatus: 'pending',
      visibilityStatus: 'private', verificationState: 'unverified', createdAt: now, updatedAt: now };
    db().exec('BEGIN IMMEDIATE');
    try {
      insertContribution(c, requestId);
      for (const m of media) db().prepare('INSERT INTO media VALUES (?, ?, ?, ?, ?, ?)').run(m.id, id, m.originalFilename, m.mime, now, m.storedFilename);
      db().exec('COMMIT');
    } catch (e) { db().exec('ROLLBACK'); throw e; }
    const response = NextResponse.json({ id, status: 'pending' }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set('civic_session', sessionId, { httpOnly: true, sameSite: 'strict', secure: (process.env.CIVIC_PUBLIC_ORIGIN || request.url).startsWith('https:'), path: '/', maxAge: 60 * 60 * 24 * 90 });
    return response;
  } catch (e) {
    for (const name of saved) await deleteMedia(name);
    // Database/filesystem failures are never returned with paths or internals.
    if (e instanceof Error && /SQLITE|ENOENT|EACCES|UNIQUE|database/i.test(e.message)) return failure(new Error('Submission could not be saved. Please try again.'), 503);
    return failure(e);
  }
}
