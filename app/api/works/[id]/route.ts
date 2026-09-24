import { NextResponse } from 'next/server';
import { getWork } from '@/lib/works';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const officialRecord = await getWork(id);
  return NextResponse.json(officialRecord ? { officialRecord } : { error: 'Work not found' }, { status: officialRecord ? 200 : 404 });
}
