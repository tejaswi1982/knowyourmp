import { NextRequest, NextResponse } from 'next/server';
import { contributions } from '@/lib/contributions/store';
export const dynamic = 'force-dynamic';
export function GET(request: NextRequest) {
  const session = request.cookies.get('civic_session')?.value;
  const mine = session ? contributions().filter(c => c.sessionId === session) : [];
  return NextResponse.json({ worksChecked: new Set(mine.filter(c => c.kind === 'observation').map(c => c.workId)).size, documentsAdded: mine.filter(c => c.kind === 'document').length }, { headers: { 'Cache-Control': 'no-store' } });
}
