import { NextResponse } from 'next/server';
import { listWorks } from '@/lib/works';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ works: await listWorks() }); }
