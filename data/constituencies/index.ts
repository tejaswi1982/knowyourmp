import type { Constituency } from '@/types/civic';

/**
 * Constituency registry.
 *
 * One entry today, 543 later. Adding a seat means appending an object here:
 * no route, component or lookup change is required.
 */
export const CONSTITUENCIES: Constituency[] = [
  {
    id: 'mh-27-mumbai-north-west',
    slug: 'mumbai-north-west',
    name: 'Mumbai North-West',
    code: 'MH-27',
    state: 'Maharashtra',
    stateCode: 'MH',
    house: 'lok-sabha',
    assemblySegments: [
      'Jogeshwari East',
      'Dindoshi',
      'Goregaon',
      'Versova',
      'Andheri West',
      'Andheri East',
    ],
    localities: [
      'Andheri West',
      'Andheri East',
      'Versova',
      'Jogeshwari',
      'Goregaon',
      'Oshiwara',
      'Lokhandwala',
    ],
    samplePins: ['400053', '400058', '400061', '400062', '400102', '400104'],
    pinLocalities: {
      '400053': 'Andheri West',
      '400058': 'Andheri West',
      '400061': 'Versova',
      '400062': 'Goregaon',
      '400102': 'Jogeshwari West',
      '400104': 'Goregaon West',
    },
    lookupMetadata: {
      method: 'manual-verified',
      caveat:
        'PIN codes are postal geography. They do not map exactly onto electoral boundaries, and a single PIN can straddle two constituencies. Treat this as a starting point, then confirm against your voter roll entry.',
      lastReviewed: '2026-08-17',
      sourceRefs: ['india-post-pincode', 'eci-delimitation-2008'],
    },
  },
];

export const CONSTITUENCIES_BY_SLUG = new Map(CONSTITUENCIES.map((c) => [c.slug, c]));
export const CONSTITUENCIES_BY_ID = new Map(CONSTITUENCIES.map((c) => [c.id, c]));

/** Total seats in the Lok Sabha, the denominator this project is building toward. */
export const TOTAL_LOK_SABHA_SEATS = 543;
