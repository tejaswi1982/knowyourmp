/**
 * Core civic data model.
 *
 * Everything the site renders is described here first. The MVP loads these
 * shapes from local seed files (`/data`), but nothing in the UI knows that  - 
 * swap the repository layer (`/lib/repository.ts`) for a database or API and
 * the pages keep working unchanged.
 *
 * Two rules are encoded structurally rather than left to editorial discipline:
 *
 *  1. Every published number carries its provenance. `Metric` cannot exist
 *     without a `sourceRefs` array, so an unsourced figure is a type error.
 *  2. Missing data is a first-class state, not an empty string. `Availability`
 *     forces every consumer to render an honest state instead of a zero.
 */

/* -------------------------------------------------------------------------- */
/*  Provenance                                                                 */
/* -------------------------------------------------------------------------- */

/** A citable public source. Every figure on the site points at one of these. */
export interface SourceReference {
  official?: boolean;
  parserVersion?: string;
  manifests?: SnapshotManifest[];
  id: string;
  /** Human-readable title as it appears at the source. */
  title: string;
  url: string;
  /** Body that published it, e.g. "Election Commission of India". */
  publisher: string;
  /** Publisher abbreviation used in the inline provenance line, e.g. "ECI". */
  code: string;
  /** The document itself, where it has a name, e.g. "FORM 26". */
  docRef?: string;
  /** Period the document covers, e.g. "2024". Distinct from `retrievedAt`. */
  period?: string;
  /** ISO date the value was read from the source. */
  retrievedAt: string;
  /** Optional caveat shown alongside the link. */
  note?: string;
  /**
   * Whether `url` points at the exact record or only at the publisher's portal
   * root. Deep links are never invented: if the specific document URL has not
   * been verified, the root stays and this is marked `pending`, which the
   * interface surfaces rather than hides.
   */
  deepLinkStatus?: 'exact' | 'pending' | 'unavailable';
}

/**
 * How complete a given figure is.
 *
 * `published`  - taken from a named public source, verified by a human.
 * `demo`       - illustrative structure only; not a real reported figure.
 * `pending`    - the source exists, integration is not built yet.
 * `unavailable`- no public source publishes this; we say so rather than guess.
 */
export type Availability = 'published' | 'demo' | 'pending' | 'unavailable' | 'source-unavailable' | 'no-data';

/** How a metric's value should be rendered. */
export type MetricFormat = 'currency-inr' | 'number' | 'percent' | 'text';

/**
 * A single displayable fact.
 *
 * The generic parameter keeps numeric metrics numeric while allowing text
 * metrics (education category, party) to share the same provenance envelope.
 */
export interface Metric<T = number | string> {
  label: string;
  value: T | null;
  format: MetricFormat;
  availability: Availability;
  /** Period the figure describes, e.g. "As declared, 2024 general election". */
  reportingPeriod?: string;
  /** Plain-language explanation of what the number does and does not mean. */
  note?: string;
  sourceRefs: string[];
}

/* -------------------------------------------------------------------------- */
/*  Geography                                                                  */
/* -------------------------------------------------------------------------- */

export interface Constituency {
  id: string;
  slug: string;
  name: string;
  /**
   * State code and the seat's official number within that state, e.g. "MH-27".
   * Used throughout the interface as an orientation mark  -  the civic equivalent
   * of a route number. Every seat in the country has one, so this scales to 543
   * without becoming decorative.
   */
  code: string;
  state: string;
  /** Two-letter state code, split out so it can be set apart typographically. */
  stateCode: string;
  house: House;
  /** Vidhan Sabha segments that make up this Lok Sabha seat. */
  assemblySegments: string[];
  /** Localities a citizen might type, used for recognition and reassurance. */
  localities: string[];
  /** PIN codes that resolve to this constituency in the MVP lookup. */
  samplePins: string[];
  /**
   * PIN to locality, where the locality has been confirmed. Used only to echo
   * a recognisable place name back to the citizen. Absent entries fall back to
   * the seat name rather than guessing a neighbourhood.
   */
  pinLocalities?: Record<string, string>;
  lookupMetadata: LookupMetadata;
}

export interface LookupMetadata {
  /** How the PIN to constituency mapping was established. */
  method: 'manual-verified' | 'derived' | 'estimated';
  /**
   * PIN codes are postal geography and do not align perfectly with electoral
   * boundaries. This string is surfaced in the UI wherever a lookup happens.
   */
  caveat: string;
  lastReviewed: string;
  sourceRefs: string[];
}

/** A resolved lookup, kept as a record so the flow can later be logged/tested. */
export interface LookupRecord {
  query: string;
  queryType: 'pin' | 'locality' | 'coordinates';
  matched: boolean;
  constituencySlug?: string;
  /** Seat code, e.g. "MH-27". Carried so the UI never hardcodes a seat. */
  constituencyCode?: string;
  constituencyName?: string;
  representativeSlug?: string;
  /** Locality label to echo back, e.g. "Andheri West". */
  matchedLabel?: string;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/*  Representative                                                             */
/* -------------------------------------------------------------------------- */

export type House = 'lok-sabha' | 'rajya-sabha';

export interface Term {
  /** e.g. "18th Lok Sabha" */
  label: string;
  startYear: number;
  /** Null while the term is ongoing. */
  endYear: number | null;
}

/**
 * Identifiers assigned by the source systems themselves.
 *
 * Names are not identifiers. Transliteration varies between the Election
 * Commission, the Lok Sabha Secretariat and MPLADS, initials get expanded or
 * dropped, and several members share a name. Joining datasets on a name will
 * eventually attribute one person's record to another, so every cross-dataset
 * join goes through these.
 *
 * Unknown ids are omitted, never guessed. An absent id means the ingestion
 * adapter has nothing to key on and must not run for that source.
 */
export interface ExternalIds {
  /** Member id in Digital Sansad / sansad.in. */
  sansadMemberId?: string;
  /** Candidate id in the ECI affidavit system. */
  eciCandidateId?: string;
  /** Member id on the MPLADS portal. */
  mpladsMemberId?: string;
}

export interface Representative {
  id: string;
  slug: string;
  fullName: string;
  /** Honorific rendered separately so the name itself stays machine-clean. */
  honorific?: string;
  party: string;
  partyShort: string;
  constituencyId: string;
  house: House;
  term: Term;
  portrait: Portrait | null;
  /** One neutral line of context. Never evaluative. */
  tagline: string;
  recordSummary: RecordSummaryItem[];
  /** Keys into the source systems. See `ExternalIds`. */
  externalIds?: ExternalIds;
  sourceRefs: string[];
}

export interface Portrait {
  src: string;
  alt: string;
  /** Credit line required by the source's terms of use. */
  credit?: string;
}

/** The "at a glance" band. Order here is the order rendered. */
export interface RecordSummaryItem {
  key: string;
  metric: Metric;
}

/* -------------------------------------------------------------------------- */
/*  Public record: affidavit                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Self-declared information from the affidavit filed with the Election
 * Commission at the time of nomination. These are declarations, not findings.
 */
export interface AffidavitRecord {
  representativeId: string;
  electionYear: number;
  /** e.g. "Graduate"  -  the category as recorded on the affidavit form. */
  education: Metric<string>;
  /** Institutions and years, verbatim where possible. */
  educationDetail: string;
  assets: Metric<number>;
  liabilities: Metric<number>;
  criminalCases: CriminalCaseDeclaration;
  age?: Metric<number>;
  sourceRefs: string[];
}

/**
 * Held separately from the other metrics because it carries a legal caveat that
 * must travel with the number wherever it is rendered.
 */
export interface CriminalCaseDeclaration {
  label: string;
  declaredCount: number | null;
  availability: Availability;
  reportingPeriod?: string;
  /**
   * Required. Rendering a case count without the presumption-of-innocence
   * context is not permitted anywhere in this codebase.
   */
  legalNote: string;
  sourceRefs: string[];
}

/* -------------------------------------------------------------------------- */
/*  Public record: parliament                                                  */
/* -------------------------------------------------------------------------- */

export interface ParliamentaryActivity {
  representativeId: string;
  /** e.g. "18th Lok Sabha, Sessions 1-4" */
  session: string;
  attendance: Metric<number>;
  questions: Metric<number>;
  debates: Metric<number>;
  bills: Metric<number>;
  committees: CommitteeMembership[];
  sourceRefs: string[];
}

export interface CommitteeMembership {
  until?: string;
  sourceUrl?: string;
  provenance?: SnapshotManifest;
  name: string;
  role: string;
  since?: string;
  availability: Availability;
  sourceRefs?: string[];
}

/* -------------------------------------------------------------------------- */
/*  Parliamentary records                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Individual parliamentary records.
 *
 * The site stores records, not totals. A total is a claim; a record is
 * evidence, and only records let a citizen click through from "37 questions"
 * to the 37 actual questions and their official answers.
 *
 * Once ingestion is live, totals are computed from these arrays (see
 * `deriveParliamentaryTotals` in `lib/parliament.ts`) and must not be seeded
 * by hand  -  a hand-entered total and a record list will drift apart.
 */

export interface ParliamentQuestion {
  sourceUrl?: string;
  provenance?: SnapshotManifest;
  questionText?: string;
  answerText?: string;
  id: string;
  representativeId: string;
  /** Which Lok Sabha, e.g. 18. */
  lokSabha: number;
  session: string;
  /** ISO date the question was tabled or answered. */
  date: string;
  questionNumber: string;
  questionType: 'starred' | 'unstarred' | 'other';
  subject: string;
  ministry?: string;
  /** Official answer document, where published. */
  answerUrl?: string;
  sourceRefs: string[];
}

/** A recorded participation in a debate or discussion. */
export interface ParliamentIntervention {
  provenance?: SnapshotManifest;
  id: string;
  representativeId: string;
  lokSabha: number;
  session: string;
  date: string;
  subject: string;
  /** e.g. "Short Duration Discussion", "Matters under Rule 377". */
  debateType?: string;
  sourceUrl: string;
  sourceRefs: string[];
}

/** A bill introduced by the member personally, not a government bill. */
export interface PrivateMemberBillRecord {
  sourceUrl?: string;
  provenance?: SnapshotManifest;
  id: string;
  representativeId: string;
  title: string;
  billNumber?: string;
  introducedDate?: string;
  status?: string;
  sourceRefs: string[];
}

/**
 * Attendance, held per session rather than as one cumulative figure.
 *
 * The distinctions this preserves are the whole reason for the shape. Absent,
 * not applicable, house not sitting and data missing are four different
 * things, and a single percentage collapses them into one. `presentDays` and
 * `eligibleDays` are both optional and independent: a session can have a known
 * denominator and an unknown numerator.
 */
export interface AttendanceSessionRecord {
  sourceUrl?: string;
  provenance?: SnapshotManifest;
  period?: string;
  signedDays?: number;
  calendarDays?: number;
  missingDays?: number;
  outsideCalendarDates?: string[];
  representativeId: string;
  lokSabha: number;
  session: string;
  presentDays?: number;
  /** Sitting days on which this member was eligible to attend. */
  eligibleDays?: number;
  /** As published by the source, where the source publishes one. */
  percentage?: number;
  /** Why a figure is absent, when it is. */
  note?: string;
  retrievedAt: string;
  sourceRefs: string[];
}

/** Every record-level parliamentary dataset for one member. */
export interface ParliamentaryRecords {
  questions: ParliamentQuestion[];
  interventions: ParliamentIntervention[];
  bills: PrivateMemberBillRecord[];
  attendance: AttendanceSessionRecord[];
  committees: CommitteeMembership[];
}

/* -------------------------------------------------------------------------- */
/*  Public money                                                               */
/* -------------------------------------------------------------------------- */

export type FundScheme = 'MPLADS';

export interface FundSummary {
  allocatedLimit?: Metric<number>;
  released?: Metric<number>;
  utilization?: Metric<number>;
  representativeId: string;
  scheme: FundScheme;
  /** e.g. "18th Lok Sabha term, to date" */
  period: string;
  entitlement: Metric<number>;
  recommended: Metric<number>;
  sanctioned: Metric<number>;
  spent: Metric<number>;
  balance: Metric<number>;
  /** Scheme rules the citizen needs in order to read the numbers correctly. */
  schemeNotes: string[];
  sourceRefs: string[];
}

export type ProjectStatus = 'recommended' | 'sanctioned' | 'in-progress' | 'completed';

/**
 * A single work recorded under the scheme.
 *
 * `officialTitle` is the government's own text and is preserved verbatim and
 * always displayed. `normalizedTitle` and `category` are ours  -  tidied or
 * classified for grouping and search  -  and are kept in separate fields so a
 * derived label can never be mistaken for the record. If the two ever
 * disagree, the official text is the record.
 */
export interface ProjectRecord {
  description?: string;
  officialStatus?: string;
  statusNote?: string;
  districtAuthority?: string;
  implementingAgency?: string;
  reportingPeriod?: string;
  sourceUrl?: string;
  provenance?: SnapshotManifest[];
  id: string;
  representativeId: string;
  /** Verbatim from the source. Never rewritten. */
  officialTitle: string;
  /** Our cleaned-up rendering, if any. Display only alongside the official text. */
  normalizedTitle?: string;
  category?: string;
  locationText?: string;
  amountRecommended?: number;
  amountSanctioned?: number;
  amountSpent?: number;
  status?: ProjectStatus;
  recommendationDate?: string;
  sanctionDate?: string;
  completionDate?: string;
  /** Whether this row is a real record or illustrative structure. */
  availability: Availability;
  sourceRefs: string[];
}

/* -------------------------------------------------------------------------- */
/*  Aggregate                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Provenance for one ingestion run.
 *
 * Government data is never normalised without keeping what was actually
 * received. When a parser turns out to be wrong, the snapshot is the only way
 * to tell a bad parse from a changed source  -  and `contentHash` is how a sync
 * knows nothing changed and it has nothing to republish.
 */
export interface SnapshotManifest {
  sourceIdentifier?: string;
  method?: string;
  requestBody?: string;
  sourceUrl: string;
  retrievedAt: string;
  /** Bump when parsing logic changes, so reprocessing is traceable. */
  parserVersion: string;
  /** SHA-256 of the raw payload as received. */
  contentHash: string;
  /** Path or object key of the stored raw payload. */
  storedAt?: string;
  /** HTTP status and content type, for diagnosing a failed run. */
  status?: number;
  contentType?: string;
}

/** Everything a single representative page needs, assembled by the repository. */
export interface RepresentativeProfile {
  ingestion?: Partial<Record<'sansad' | 'mplads', IngestionState>>;
  representative: Representative;
  constituency: Constituency;
  affidavit: AffidavitRecord | null;
  parliamentary: ParliamentaryActivity | null;
  /** Record-level parliamentary data. Empty arrays until ingestion runs. */
  parliamentaryRecords: ParliamentaryRecords;
  funds: FundSummary | null;
  projects: ProjectRecord[];
  /** Only the sources actually referenced by this profile. */
  sources: SourceReference[];
  /** ISO date this profile was last reviewed by a human. */
  lastReviewed: string;
}

export interface IngestionState {
  status: 'ready' | 'partial' | 'source-unavailable' | 'parser-mismatch' | 'not-integrated';
  attemptedAt: string;
  lastSuccessAt?: string;
  message: string;
  warnings: string[];
}

export interface NormalizedSnapshot {
  version: 1;
  representativeId: string;
  sourceIdentifier: string;
  retrievedAt: string;
  state: IngestionState;
  sources: SourceReference[];
  records?: ParliamentaryRecords;
  complete?: Partial<Record<keyof ParliamentaryRecords, boolean>>;
  funds?: FundSummary;
  projects?: ProjectRecord[];
}
