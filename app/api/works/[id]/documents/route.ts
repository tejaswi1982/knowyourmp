import { NextRequest } from 'next/server';
import { submit } from '@/lib/contributions/http';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return submit(request, id, 'document'); }
