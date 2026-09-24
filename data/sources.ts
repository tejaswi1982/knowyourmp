import type { SourceReference } from '@/types/civic';
import { readPublished } from '@/lib/ingestion/storage';

/**
 * The source registry.
 *
 * Sources live in one place and are referenced by id from every record. A
 * single link correction propagates everywhere, and the methodology page can
 * enumerate the full evidence base without duplicating strings.
 *
 * `code`, `docRef` and `period` compose the inline provenance line the
 * interface prints under figures  -  "ECI · FORM 26 · 2024 ↗".
 */
export const SOURCES: Record<string, SourceReference> = {
  'eci-affidavit-2024': {
    id: 'eci-affidavit-2024',
    title: 'Affidavit filed with nomination, Mumbai North-West, General Election 2024',
    url: 'https://affidavit.eci.gov.in/',
    publisher: 'Election Commission of India',
    code: 'ECI',
    docRef: 'Form 26',
    period: '2024',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'pending',
    note: 'Self-sworn declaration filed by the candidate at the time of nomination. The Commission publishes the affidavit; it does not verify the contents.',
  },
  'eci-result-2024': {
    id: 'eci-result-2024',
    title: 'General Election to Lok Sabha 2024  -  constituency-wise result',
    url: 'https://results.eci.gov.in/',
    publisher: 'Election Commission of India',
    code: 'ECI',
    docRef: 'Result',
    period: '2024',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'pending',
  },
  'lok-sabha-member-profile': {
    id: 'lok-sabha-member-profile',
    title: 'Member profile, 18th Lok Sabha',
    url: 'https://sansad.in/ls/members/biography/5701?from=members',
    publisher: 'Lok Sabha Secretariat',
    code: 'LS Sectt.',
    docRef: 'Member profile',
    period: '18LS',
    retrievedAt: '2026-09-24',
    deepLinkStatus: 'exact',
    note: 'Official member biography and constituency listing.',
  },
  'digital-sansad-activity': {
    id: 'digital-sansad-activity',
    title: 'Member-wise questions, debates and legislative activity',
    url: 'https://sansad.in/ls',
    publisher: 'Digital Sansad, Lok Sabha Secretariat',
    code: 'Digital Sansad',
    period: '18LS',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'pending',
    note: 'Attendance and participation records are published session by session and are revised after each session concludes.',
  },
  'mplads-guidelines': {
    id: 'mplads-guidelines',
    title: 'Guidelines on Member of Parliament Local Area Development Scheme',
    url: 'https://www.mplads.gov.in/mplads/UploadedDocuments/Guidelines.pdf',
    publisher: 'Ministry of Statistics and Programme Implementation',
    code: 'MoSPI',
    docRef: 'MPLADS Guidelines',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'exact',
    note: 'Defines the annual entitlement, the recommend-sanction-release sequence, and what the funds may be spent on.',
  },
  'mplads-portal': {
    id: 'mplads-portal',
    title: 'MPLADS portal  -  constituency and work-wise expenditure',
    url: 'https://www.mplads.gov.in/',
    publisher: 'Ministry of Statistics and Programme Implementation',
    code: 'MPLADS',
    docRef: 'Work register',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'pending',
    note: 'Work-level records are published by the District Authority and update on their own schedule.',
  },
  'india-post-pincode': {
    id: 'india-post-pincode',
    title: 'PIN code directory',
    url: 'https://www.indiapost.gov.in/vas/Pages/findpincode.aspx',
    publisher: 'Department of Posts, Government of India',
    code: 'India Post',
    docRef: 'PIN directory',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'exact',
    note: 'Used only to identify the locality. Postal boundaries are not electoral boundaries.',
  },
  'eci-delimitation-2008': {
    id: 'eci-delimitation-2008',
    title: 'Delimitation of Parliamentary and Assembly Constituencies Order, 2008  -  Maharashtra',
    url: 'https://eci.gov.in/delimitation-website/delimitation/',
    publisher: 'Delimitation Commission of India',
    code: 'Delimitation Cmsn.',
    docRef: 'Order',
    period: '2008',
    retrievedAt: '2026-08-17',
    deepLinkStatus: 'pending',
    note: 'Defines which assembly segments make up each Lok Sabha constituency.',
  },
};

/** Resolve a list of source ids to full references, skipping unknown ids. */
export function resolveSources(ids: string[]): SourceReference[] {
  const registry = { ...SOURCES, ...Object.fromEntries(['sansad','mplads'].flatMap(source => readPublished(source as 'sansad'|'mplads')?.sources ?? []).map(s=>[s.id,s])) };
  return ids.map((id) => {
    const source = registry[id];
    if(!source) throw new Error(`Unknown civic source: ${id}`);
    return source;
  });
}

export function allSources(): SourceReference[] {
  return [...Object.values(SOURCES),...['sansad','mplads'].flatMap(source=>readPublished(source as 'sansad'|'mplads')?.sources??[])];
}

/** De-duplicated resolution across many id lists. */
export function collectSources(...idLists: (string[] | undefined)[]): SourceReference[] {
  const seen = new Set<string>();
  for (const list of idLists) {
    for (const id of list ?? []) seen.add(id);
  }
  return resolveSources([...seen]);
}
