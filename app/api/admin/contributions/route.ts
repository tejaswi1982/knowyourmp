import { NextResponse } from 'next/server';
import { contributions, moderate, db, rateLimit } from '@/lib/contributions/store';
import { failure, isAdmin, sameOrigin } from '@/lib/contributions/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (!isAdmin(request)) return failure(new Error('Admin credentials required.'), 401);
  return NextResponse.json({ contributions: contributions().map(({ sessionId: _session, ...c }) => ({ ...c, media: db().prepare('SELECT id, original_filename, mime, uploaded_at FROM media WHERE contribution_id = ?').all(c.id) })) }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (!isAdmin(request)) { rateLimit('admin-failures', 30); return failure(new Error('Admin credentials required.'), 401); }
    if (Number(request.headers.get('content-length')) > 4096) throw new Error('Request too large.');
    const { id, status, sourceChecked } = await request.json();
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id) || !['published', 'rejected', 'needs_review'].includes(status)) throw new Error('Invalid moderation action.');
    moderate(id, status, sourceChecked === true);
    return NextResponse.json({ status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) { return failure(e); }
}
