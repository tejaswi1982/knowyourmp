import { NextResponse } from 'next/server';
import { listProfiles } from '@/lib/repository';
import { TOTAL_LOK_SABHA_SEATS } from '@/data/constituencies';
import { lookup } from '@/lib/lookup';
export const dynamic = 'force-dynamic';

/**
 * GET /api/mps
 * GET /api/mps?pin=400053
 *
 * The index of published representatives, and the lookup endpoint. Public and
 * open by intent  -  a civic record that cannot be read by other tools is only
 * half public.
 *
 * The `pin` branch runs the same `lookup()` the browser uses, so the two can
 * never drift apart.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('pin') ?? searchParams.get('q');

  if (query) {
    const record = lookup(query);
    return NextResponse.json(
      {
        query: record.query,
        matched: record.matched,
        constituency: record.constituencySlug ?? null,
        constituencyCode: record.constituencyCode ?? null,
        constituencyName: record.constituencyName ?? null,
        representative: record.representativeSlug ?? null,
        matchedLabel: record.matchedLabel ?? null,
        message: record.message ?? null,
        href: record.matched ? `/mp/${record.constituencySlug}` : null,
      },
      { status: record.matched ? 200 : 404 },
    );
  }

  const profiles = await listProfiles();

  return NextResponse.json({
    coverage: {
      published: profiles.length,
      total: TOTAL_LOK_SABHA_SEATS,
    },
    representatives: profiles.map((profile) => ({
      slug: profile.representative.slug,
      fullName: profile.representative.fullName,
      party: profile.representative.party,
      house: profile.representative.house,
      term: profile.representative.term.label,
      constituency: {
        slug: profile.constituency.slug,
        code: profile.constituency.code,
        name: profile.constituency.name,
        state: profile.constituency.state,
      },
      externalIds: profile.representative.externalIds ?? {},
      href: `/mp/${profile.constituency.slug}`,
      lastReviewed: profile.lastReviewed,
    })),
  });
}
