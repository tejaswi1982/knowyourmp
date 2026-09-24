import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { db } from '@/lib/contributions/store';
import { isAdmin } from '@/lib/contributions/http';
import { mediaPath } from '@/lib/contributions/media';
import type { Contribution } from '@/lib/contributions/model';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new NextResponse(null, { status: 404 });
  const row = db().prepare('SELECT media.*, contributions.payload FROM media JOIN contributions ON contributions.id=media.contribution_id WHERE media.id=?').get(id) as { payload: string; mime: string; stored_filename: string } | undefined;
  if (!row) return new NextResponse(null, { status: 404 });
  const c: Contribution = JSON.parse(row.payload);
  if (!(c.moderationStatus === 'published' && c.visibilityStatus === 'public') && !isAdmin(request)) return new NextResponse(null, { status: 404 });
  try {
    return new NextResponse(await readFile(mediaPath(row.stored_filename)), { headers: { 'Content-Type': row.mime, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Cache-Control': 'private, no-store', 'Content-Disposition': row.mime === 'application/pdf' ? 'attachment; filename="citizen-document.pdf"' : 'inline' } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
