import { NextRequest, NextResponse } from 'next/server';
import { getWork } from '@/lib/works';
import { published } from '@/lib/contributions/store';
import { submit } from '@/lib/contributions/http';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await getWork(id)) return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  return NextResponse.json({ observations: published(id).filter(c => c.kind === 'observation') }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return submit(request, id, 'observation'); }
