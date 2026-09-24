import type {
  AffidavitRecord,
  FundSummary,
  ParliamentaryActivity,
  ParliamentaryRecords,
  ProjectRecord,
  Representative,
} from '@/types/civic';

/**
 * Seed profile: Mumbai North-West, 18th Lok Sabha.
 *
 * This is the first node of the system. Fields marked `published` were read
 * from a named public source and reviewed by a person. Fields marked `pending`
 * have a known source that is not yet integrated, and the UI says so rather
 * than showing a zero. Fields marked `demo` exist to show the shape of the
 * section and are stamped as such wherever they render.
 */

const REPRESENTATIVE_ID = 'ls18-mh-mumbai-north-west';

export const representative: Representative = {
  id: REPRESENTATIVE_ID,
  slug: 'ravindra-waikar',
  fullName: 'Ravindra Dattaram Waikar',
  honorific: 'Shri',
  party: 'Shiv Sena',
  partyShort: 'SS',
  constituencyId: 'mh-27-mumbai-north-west',
  house: 'lok-sabha',
  term: {
    label: '18th Lok Sabha',
    startYear: 2024,
    endYear: null,
  },
  portrait: null, // No portrait under a licence we can redistribute. See PortraitPlate.
  tagline: 'Elected from Mumbai North-West in the 2024 general election.',
  recordSummary: [
    {
      key: 'party',
      metric: {
        label: 'Party',
        value: 'Shiv Sena',
        format: 'text',
        availability: 'published',
        reportingPeriod: 'At the 2024 general election',
        sourceRefs: ['eci-result-2024'],
      },
    },
    {
      key: 'term',
      metric: {
        label: 'Term',
        value: '18th Lok Sabha',
        format: 'text',
        availability: 'published',
        reportingPeriod: 'From 2024',
        sourceRefs: ['lok-sabha-member-profile'],
      },
    },
    {
      key: 'education',
      metric: {
        label: 'Education',
        value: 'Graduate',
        format: 'text',
        availability: 'published',
        reportingPeriod: 'As declared, 2024',
        note: 'The category recorded on the nomination affidavit.',
        sourceRefs: ['eci-affidavit-2024'],
      },
    },
    {
      key: 'assets',
      metric: {
        label: 'Declared assets',
        value: 545049854,
        format: 'currency-inr',
        availability: 'published',
        reportingPeriod: 'As declared, 2024',
        note: 'Movable and immovable assets declared for self, spouse and dependants.',
        sourceRefs: ['eci-affidavit-2024'],
      },
    },
    {
      key: 'liabilities',
      metric: {
        label: 'Declared liabilities',
        value: 44810574,
        format: 'currency-inr',
        availability: 'published',
        reportingPeriod: 'As declared, 2024',
        note: 'Loans and dues declared in the same affidavit.',
        sourceRefs: ['eci-affidavit-2024'],
      },
    },
    {
      key: 'criminal-cases',
      metric: {
        label: 'Declared criminal cases',
        value: 3,
        format: 'number',
        availability: 'published',
        reportingPeriod: 'As declared, 2024',
        note: 'Cases declared as pending at the time of nomination. A pending case is an allegation that a court has not ruled on.',
        sourceRefs: ['eci-affidavit-2024'],
      },
    },
  ],
  /**
   * Keys into the source systems. Only the Sansad member id is known; the ECI
   * and MPLADS ids are omitted rather than guessed, and their adapters will
   * refuse to run until someone verifies and adds them.
   */
  externalIds: {
    sansadMemberId: '5701',
  },
  sourceRefs: ['eci-result-2024', 'lok-sabha-member-profile'],
};

export const affidavit: AffidavitRecord = {
  representativeId: REPRESENTATIVE_ID,
  electionYear: 2024,
  education: {
    label: 'Education category',
    value: 'Graduate',
    format: 'text',
    availability: 'published',
    reportingPeriod: 'As declared, 2024',
    note: 'Affidavits record education as a category. The detail below is the supporting text as filed.',
    sourceRefs: ['eci-affidavit-2024'],
  },
  educationDetail:
    'Bachelor of Science from Patkar College, Goregaon West, 1982. SSC from the Maharashtra State Secondary and Higher Secondary Education Board, Arvind Gandbhir High School, 1975.',
  assets: {
    label: 'Declared assets',
    value: 545049854,
    format: 'currency-inr',
    availability: 'published',
    reportingPeriod: 'As declared at nomination, 2024',
    note: 'A declaration of total movable and immovable assets for self, spouse and dependants. Immovable assets are usually stated at acquisition or circle value, so this figure is not a market valuation.',
    sourceRefs: ['eci-affidavit-2024'],
  },
  liabilities: {
    label: 'Declared liabilities',
    value: 44810574,
    format: 'currency-inr',
    availability: 'published',
    reportingPeriod: 'As declared at nomination, 2024',
    note: 'Loans, dues and other liabilities declared in the same affidavit. Read alongside assets rather than on its own.',
    sourceRefs: ['eci-affidavit-2024'],
  },
  criminalCases: {
    label: 'Declared criminal cases',
    declaredCount: 3,
    availability: 'published',
    reportingPeriod: 'As declared at nomination, 2024',
    legalNote:
      'This is the number of cases the candidate declared as pending against them when filing nomination. A pending case means a court has been asked to decide a matter. It is not a conviction, and it is not a finding of guilt. Everyone is presumed innocent until a court rules otherwise. The count says nothing about the seriousness of the cases, who filed them, or how far they have progressed.',
    sourceRefs: ['eci-affidavit-2024'],
  },
  sourceRefs: ['eci-affidavit-2024'],
};

/**
 * Parliamentary activity context.
 *
 * Deliberately holds no totals. The four headline figures are derived from
 * `parliamentaryRecords` at assembly time, so there is exactly one place a
 * count can come from and no hand-maintained number to drift out of step with
 * the records behind it. See `lib/parliament.ts`.
 */
export const parliamentaryMeta = {
  representativeId: REPRESENTATIVE_ID,
  lokSabha: 18,
  session: '18th Lok Sabha',
  sourceRefs: ['digital-sansad-activity', 'lok-sabha-member-profile'],
};

/**
 * MPLADS.
 *
 * The entitlement is a published scheme rule and is shown as fact. The
 * recommended, sanctioned, spent and balance figures come from the MPLADS
 * portal and are not yet integrated for this constituency.
 */
export const funds: FundSummary = {
  representativeId: REPRESENTATIVE_ID,
  scheme: 'MPLADS',
  period: '18th Lok Sabha term, to date',
  entitlement: {
    label: 'Annual entitlement',
    value: 50000000,
    format: 'currency-inr',
    availability: 'published',
    reportingPeriod: 'Per year, per Member of Parliament',
    note: 'Every MP may recommend works up to ₹5 crore each year under the scheme. This is an entitlement to recommend, not money held by the member.',
    sourceRefs: ['mplads-guidelines'],
  },
  recommended: {
    label: 'Amount recommended',
    value: null,
    format: 'currency-inr',
    availability: 'pending',
    reportingPeriod: '18th Lok Sabha term, to date',
    note: 'Value of works the member has recommended to the District Authority.',
    sourceRefs: ['mplads-portal'],
  },
  sanctioned: {
    label: 'Amount sanctioned',
    value: null,
    format: 'currency-inr',
    availability: 'pending',
    reportingPeriod: '18th Lok Sabha term, to date',
    note: 'Value of recommended works the District Authority has approved.',
    sourceRefs: ['mplads-portal'],
  },
  spent: {
    label: 'Amount spent',
    value: null,
    format: 'currency-inr',
    availability: 'pending',
    reportingPeriod: '18th Lok Sabha term, to date',
    note: 'Expenditure reported against sanctioned works.',
    sourceRefs: ['mplads-portal'],
  },
  balance: {
    label: 'Amount remaining',
    value: null,
    format: 'currency-inr',
    availability: 'pending',
    reportingPeriod: '18th Lok Sabha term, to date',
    note: 'Unspent balance held with the District Authority.',
    sourceRefs: ['mplads-portal'],
  },
  schemeNotes: [
    'MPLADS money is never held by the Member of Parliament. The member recommends works; the District Authority sanctions them, executes them and reports the expenditure.',
    'Because sanction and execution sit with the district administration, a delay in spending is not by itself attributable to the member, and a completed work is not by itself built by the member.',
    'Unspent balances can carry forward between financial years. Read expenditure alongside the reporting period and the separate allocation and sanction figures.',
  ],
  sourceRefs: ['mplads-guidelines', 'mplads-portal'],
};

/**
 * Project records.
 *
 * Empty on purpose.
 *
 * This previously held three placeholder rows to show the table's shape. They
 * are gone: a list of invented works sitting under a real MP's name is exactly
 * the kind of thing that gets screenshotted without its caption. The work
 * register renders nothing when this is empty, and chapter 06 states plainly
 * that place-level data is not connected yet.
 *
 * Populate from the MPLADS work-level sync, preserving `officialTitle` verbatim.
 */
export const projects: ProjectRecord[] = [];

/**
 * Record-level parliamentary data.
 *
 * Empty until the Digital Sansad adapters run. Totals are derived from these
 * arrays by `deriveParliamentaryTotals`, so an empty set yields `pending`
 * rather than zero, and no total needs to be maintained by hand.
 */
export const parliamentaryRecords: ParliamentaryRecords = {
  questions: [],
  interventions: [],
  bills: [],
  attendance: [],
  committees: [],
};

export const lastReviewed = '2026-08-17';
