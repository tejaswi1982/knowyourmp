import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/repository';
export const dynamic = 'force-dynamic';

/**
 * GET /api/mps/[slug]
 *
 * The full profile, sources included. Addressable by either the constituency
 * slug or the member slug, matching the page routes.
 *
 * The response is the `RepresentativeProfile` shape verbatim  -  availability
 * states and source references travel with the data, so a consumer cannot
 * accidentally publish a pending figure as a real one.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return NextResponse.json(
      { error: 'not_found', message: `No published record for "${slug}".` },
      { status: 404 },
    );
  }

  return NextResponse.json(profile);
}
