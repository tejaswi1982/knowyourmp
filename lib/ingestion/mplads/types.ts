import type { SnapshotManifest } from '@/types/civic';

export type MpladsDataset = 'summary' | 'works' | 'expenditure';

export interface MpladsPayload {
  mpladsMemberId?: string;
  reportKey?: string;
  dataset: MpladsDataset;
  constituencyCode: string;
  manifest: SnapshotManifest;
  body: string;
}

/**
 * The summary figures as the portal reports them, before mapping to
 * `FundSummary`.
 *
 * Every field is optional. The portal does not always publish every column for
 * every constituency, and a missing column must stay missing: a blank cell is
 * not a zero, and the difference is the difference between "not reported" and
 * "nothing was spent".
 */
export interface MpladsSummaryRaw {
  allocatedLimit?: number;
  /** Verbatim label from the report, kept so mapping can be audited. */
  reportLabel?: string;
  entitlement?: number;
  released?: number;
  recommended?: number;
  sanctioned?: number;
  spent?: number;
  balance?: number;
  /** The "as on" date the report itself states. */
  reportedAsOn?: string;
}
