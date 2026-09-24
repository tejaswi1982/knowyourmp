import type {
  AttendanceSessionRecord,
  Metric,
  ParliamentaryRecords,
} from '@/types/civic';

/**
 * Parliamentary counting methodology, as code.
 *
 * The rules below are the same ones published on `/methodology`. Keeping them
 * in one function rather than scattered through the ingestion adapters means
 * the published definition and the arithmetic cannot drift apart.
 *
 * A total is only ever computed from records. Nothing here invents a figure:
 * an empty record set returns `pending`, not zero, because "we have not
 * ingested this yet" and "this member asked no questions" are different claims
 * and only one of them is ours to make.
 */

/** Bump when a counting rule changes; stored alongside derived figures. */
export const COUNTING_VERSION = '2026.08-1';

/**
 * QUESTIONS  -  count unique official question IDs on which the member is listed
 * as a questioner. Questions are frequently tabled jointly, so the same
 * question number can appear once per member; de-duplicating by id prevents
 * one question counting several times for the same person.
 */
export function countQuestions(records: ParliamentaryRecords): number {
  return new Set(records.questions.map((q) => q.id)).size;
}

/**
 * DEBATES  -  count unique official participation records, not pages on which
 * the member's name appears. A name occurring in a transcript may be someone
 * else speaking about them; only a recorded intervention counts.
 */
export function countInterventions(records: ParliamentaryRecords): number {
  return new Set(records.interventions.map((i) => i.id)).size;
}

/**
 * BILLS  -  count private member bills introduced by the member. Government
 * bills they spoke on are not theirs and are not counted here.
 */
export function countBills(records: ParliamentaryRecords): number {
  return new Set(records.bills.map((b) => b.id)).size;
}

/**
 * ATTENDANCE  -  aggregate only across sessions where the denominator is known.
 *
 * Sessions with no `eligibleDays` are excluded from both sides of the fraction
 * rather than treated as zero: a member sworn in mid-term, or a session the
 * source has not published, would otherwise be silently counted as absence.
 * The coverage figures are returned so the interface can state exactly which
 * sessions the percentage describes.
 */
export function deriveAttendance(sessions: AttendanceSessionRecord[]): {
  percentage: number | null;
  presentDays: number;
  eligibleDays: number;
  sessionsCounted: number;
  sessionsTotal: number;
} {
  const usable = sessions.filter(
    (s) =>
      typeof s.eligibleDays === 'number' &&
      s.eligibleDays > 0 &&
      typeof s.presentDays === 'number' &&
      Number.isSafeInteger(s.eligibleDays) && Number.isSafeInteger(s.presentDays) &&
      s.presentDays >= 0 && s.presentDays <= s.eligibleDays,
  );

  const presentDays = usable.reduce((sum, s) => sum + (s.presentDays ?? 0), 0);
  const eligibleDays = usable.reduce((sum, s) => sum + (s.eligibleDays ?? 0), 0);

  return {
    percentage: eligibleDays > 0 ? Math.round((presentDays / eligibleDays) * 1000) / 10 : null,
    presentDays,
    eligibleDays,
    sessionsCounted: usable.length,
    sessionsTotal: sessions.length,
  };
}

/**
 * Build the four headline metrics from record sets.
 *
 * `pendingSourceRefs` is required: a metric cannot be constructed without
 * provenance even when it has no value, so a pending figure still tells the
 * citizen which source it is waiting on.
 */
export function deriveParliamentaryTotals(
  records: ParliamentaryRecords,
  pendingSourceRefs: string[],
): { attendance: Metric<number>; questions: Metric<number>; debates: Metric<number>; bills: Metric<number> } {
  const attendance = deriveAttendance(records.attendance);

  /** A count is only published when there is at least one record behind it. */
  const counted = (
    label: string,
    value: number,
    haveRecords: boolean,
    note: string,
    period?: string,
  ): Metric<number> => ({
    label,
    value: haveRecords ? value : null,
    format: 'number',
    availability: haveRecords ? 'published' : 'pending',
    reportingPeriod: period,
    note,
    sourceRefs: pendingSourceRefs,
  });

  return {
    attendance: {
      label: 'Attendance',
      value: attendance.percentage,
      format: 'percent',
      availability: attendance.percentage === null ? 'pending' : 'published',
      reportingPeriod:
        attendance.sessionsCounted > 0
          ? `${attendance.sessionsCounted} of ${attendance.sessionsTotal} sessions, ${attendance.presentDays}/${attendance.eligibleDays} sitting days`
          : 'Per session, 18th Lok Sabha',
      note: 'Counted only across sessions where the number of eligible sitting days is published.',
      sourceRefs: pendingSourceRefs,
    },
    questions: counted(
      'Questions asked',
      countQuestions(records),
      records.questions.length > 0,
      'Unique official questions on which the member is listed as a questioner.',
    ),
    debates: counted(
      'Debates participated in',
      countInterventions(records),
      records.interventions.length > 0,
      'Recorded interventions. Counts participation, not its content.',
    ),
    bills: counted(
      'Private member bills',
      countBills(records),
      records.bills.length > 0,
      'Bills introduced by the member personally, not government bills they spoke on.',
    ),
  };
}
