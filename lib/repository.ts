import type { RepresentativeProfile } from '@/types/civic';
import { PROFILES, PROFILES_BY_CONSTITUENCY_SLUG, PROFILES_BY_REP_SLUG } from '@/data/mps';
import { CONSTITUENCIES, CONSTITUENCIES_BY_SLUG } from '@/data/constituencies';
import { readPublished, readState } from './ingestion/storage';
import { deriveParliamentaryTotals } from './parliament';

/**
 * The single seam between the UI and wherever the data lives.
 *
 * Every function here is async even though the MVP resolves synchronously from
 * memory. That is deliberate: when these become database or API calls, no
 * caller has to change. Pages and route handlers must never import from
 * `/data` directly  -  they go through this module.
 */

/** Profiles addressable by either the constituency slug or the member slug. */
export async function getProfile(slug: string): Promise<RepresentativeProfile | null> {
  const seed = PROFILES_BY_CONSTITUENCY_SLUG.get(slug) ?? PROFILES_BY_REP_SLUG.get(slug);
  if(!seed) return null;
  const sansad = readPublished('sansad'), mplads = readPublished('mplads');
  const sourceState = (source:'sansad'|'mplads', snapshot:typeof sansad) => {
    const state=readState(source)??snapshot?.state;
    return !snapshot && state?.lastSuccessAt ? {...state,status:'parser-mismatch' as const,lastSuccessAt:undefined,message:'Stored snapshot is unavailable or invalid. No totals are published.',warnings:['Stored snapshot failed validation.']} : state;
  };
  const records = sansad?.records ?? seed.parliamentaryRecords;
  const totals = deriveParliamentaryTotals(records,['digital-sansad-activity']);
  if(sansad) {
    for(const [metric,key,sourceId] of [['questions','questions','sansad-questions'],['debates','interventions','sansad-debates'],['bills','bills','sansad-bills']] as const) {
      totals[metric].sourceRefs=[sourceId];
      totals[metric].reportingPeriod=`18th Lok Sabha; stored records retrieved ${sansad.retrievedAt.slice(0,10)}`;
      if(sansad.complete?.[key]) { totals[metric].availability='published'; totals[metric].value=records[key].length; }
    }
    totals.attendance = {label:'Attendance',value:null,format:'percent',availability:'no-data',note:'Read session-level entries below. Session calendars and attendance records have differing coverage; no aggregate percentage is published.',sourceRefs:['sansad-attendance']};
  }
  return {...seed,
    representative:{...seed.representative,sourceRefs:[...seed.representative.sourceRefs,...(sansad?['sansad-memberProfile']:[])]},
    parliamentaryRecords:records,
    parliamentary:seed.parliamentary?{...seed.parliamentary,...totals,committees:records.committees}:null,
    funds:mplads?.funds?{...mplads.funds,schemeNotes:seed.funds?.schemeNotes??mplads.funds.schemeNotes}:seed.funds,
    projects:mplads?.projects??seed.projects,
    sources:[...seed.sources,...sansad?.sources??[],...mplads?.sources??[]],
    ingestion:{sansad:sourceState('sansad',sansad),mplads:sourceState('mplads',mplads)},
  };
}

export async function listProfiles(): Promise<RepresentativeProfile[]> {
  return (await Promise.all(PROFILES.map(p=>getProfile(p.representative.slug)))).filter((p):p is RepresentativeProfile=>p!==null);
}

/** Slugs for `generateStaticParams`. Both address forms resolve to a page. */
export async function listProfileSlugs(): Promise<string[]> {
  return PROFILES.flatMap((p) => [p.constituency.slug, p.representative.slug]);
}

export async function getConstituency(slug: string) {
  return CONSTITUENCIES_BY_SLUG.get(slug) ?? null;
}

export async function listConstituencies() {
  return CONSTITUENCIES;
}

/** Coverage counters for the honesty strip in the footer and about page. */
export async function getCoverage() {
  return {
    constituenciesLive: CONSTITUENCIES.length,
    representativesLive: PROFILES.length,
  };
}
