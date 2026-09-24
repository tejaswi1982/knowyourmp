import type { SnapshotManifest } from '@/types/civic';

/** The datasets this adapter knows how to retrieve. */
export type SansadDataset =
  | 'memberProfile'
  | 'questions'
  | 'debates'
  | 'bills'
  | 'attendance'
  | 'committees';

export interface SansadFetchOptions {
  page?: number;
  session?: string;
  dataset: SansadDataset;
  /** Official member id. Required  -  records are never joined on a name. */
  sansadMemberId: string | undefined;
}

/** A stored snapshot, ready to be parsed. */
export interface SansadPayload {
  session?: string;
  sessionDates?: string[];
  period?: string;
  calendarManifest?: SnapshotManifest;
  dataset: SansadDataset;
  sansadMemberId: string;
  manifest: SnapshotManifest;
  body: string;
}

/**
 * The result of parsing one dataset.
 *
 * Parsers return warnings rather than throwing on a single bad row: one
 * unparseable question should not discard the other 36. A run with warnings is
 * reviewed before publication; `ok: false` blocks it entirely.
 */
export interface ParseResult<T> {
  ok: boolean;
  records: T[];
  warnings: string[];
  manifest: SnapshotManifest;
}
