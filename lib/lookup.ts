import type { LookupRecord } from '@/types/civic';
import { CONSTITUENCIES } from '@/data/constituencies';
import { representative } from '@/data/mps/ravindra-waikar';

/**
 * Location to constituency resolution.
 *
 * The MVP resolves against seed data. The function signature is the contract
 * the eventual national lookup will satisfy  -  a PIN-to-constituency table, or
 * a point-in-polygon test against published boundary files. Callers should not
 * need to change.
 */

const PIN_PATTERN = /^\d{6}$/;

/** Normalise for comparison: lowercase, collapse whitespace, strip punctuation. */
function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve a typed query  -  a 6-digit PIN or a locality name  -  to a seat.
 *
 * Returns a `LookupRecord` in every case, including failure, so the calling UI
 * always has something specific and honest to say.
 */
export function lookup(rawQuery: string): LookupRecord {
  const query = rawQuery.trim();
  const isPin = PIN_PATTERN.test(query);

  if (!query) {
    return {
      query,
      queryType: 'pin',
      matched: false,
      message: 'Enter a 6-digit PIN code, or the name of your locality.',
    };
  }

  if (/^\d+$/.test(query) && !isPin) {
    return {
      query,
      queryType: 'pin',
      matched: false,
      message: 'An Indian PIN code has six digits. Check the number and try again.',
    };
  }

  if (isPin) {
    const constituency = CONSTITUENCIES.find((c) => c.samplePins.includes(query));
    if (constituency) {
      return {
        query,
        queryType: 'pin',
        matched: true,
        constituencySlug: constituency.slug,
        constituencyCode: constituency.code,
        constituencyName: constituency.name,
        representativeSlug: representative.constituencyId===constituency.id ? representative.slug : undefined,
        // Echo a recognisable place name where we have confirmed one for this
        // PIN; otherwise the seat name, rather than guessing a neighbourhood.
        matchedLabel: constituency.pinLocalities?.[query] ?? constituency.name,
      };
    }
    return {
      query,
      queryType: 'pin',
      matched: false,
      message: `PIN ${query} is not in the record yet. Coverage starts with Mumbai North-West  -  try 400053 to see how a constituency page reads.`,
    };
  }

  // Locality match: exact first, then substring in either direction, so both
  // "andheri" and "andheri west, mumbai" find the seat.
  const needle = normalise(query);
  const constituency = CONSTITUENCIES.find((c) => {
    const names = [c.name, ...c.localities, ...c.assemblySegments].map(normalise);
    return needle.length>=4 && names.some((n) => n === needle || needle.startsWith(`${n} `));
  });

  if (constituency) {
    const matchedLocality = constituency.localities.find(
      (l) => normalise(l) === needle || normalise(l).includes(needle),
    );
    return {
      query,
      queryType: 'locality',
      matched: true,
      constituencySlug: constituency.slug,
      constituencyCode: constituency.code,
      constituencyName: constituency.name,
      representativeSlug: representative.constituencyId===constituency.id ? representative.slug : undefined,
      matchedLabel: matchedLocality ?? constituency.name,
    };
  }

  return {
    query,
    queryType: 'locality',
    matched: false,
    message: `We do not have "${query}" in the record yet. Coverage starts with Mumbai North-West  -  try 400053 or "Andheri West".`,
  };
}

/** Path a matched lookup should route to. */
export function lookupHref(record: LookupRecord): string | null {
  return record.matched && record.constituencySlug ? `/mp/${record.constituencySlug}` : null;
}

/**
 * TODO(geolocation): the browser gives us coordinates; resolving them needs a
 * point-in-polygon test against published constituency boundary geometry. The
 * signature below is what the UI will call once that layer exists.
 */
export function lookupByCoordinates(_lat: number, _lon: number): LookupRecord {
  return {
    query: 'coordinates',
    queryType: 'coordinates',
    matched: false,
    message:
      'Locating by device is not connected yet. It needs published boundary geometry to be accurate, and we would rather not guess. Type your PIN for now.',
  };
}
