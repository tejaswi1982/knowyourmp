import type { ParliamentaryRecords } from '@/types/civic';
import { date } from '../validate';

/**
 * Normalisation and validation for Digital Sansad records.
 *
 * Sits between parsing and storage. Its job is to make a bad run fail rather
 * than publish: a parser that silently starts returning nothing after a portal
 * redesign looks identical to a member who did nothing, and only a check like
 * this can tell them apart.
 */

/** Stable id, so re-running a sync updates records instead of duplicating them. */
export function recordId(parts: (string | number | undefined)[]): string {
  return parts
    .filter((p) => p !== undefined && p !== '')
    .join(':')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/** Trim and collapse whitespace without altering the words themselves. */
export function cleanText(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/** ISO date, or undefined. Never guesses a date from a partial string. */
export function toIsoDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  try { return date(input); } catch { return undefined; }
}

export interface ValidationOutcome {
  ok: boolean;
  blocking: string[];
  warnings: string[];
}

/**
 * Gate a parsed set before it reaches the database.
 *
 * `previous` is the last published set. A large unexplained drop is treated as
 * a parser failure, not as news: counts on these portals grow or hold steady,
 * so a collapse almost always means the page changed shape. Better to hold the
 * previous figures and alert a human than to publish a false decline about a
 * named person.
 */
export function validateRecords(
  next: ParliamentaryRecords,
  previous?: ParliamentaryRecords,
): ValidationOutcome {
  const blocking: string[] = [];
  const warnings: string[] = [];
  for (const records of [next.questions,next.interventions,next.bills,next.attendance,next.committees]) {
    for(const record of records) {
      if(!record.sourceRefs?.length) blocking.push('Record has no provenance');
      if('sourceUrl' in record && record.sourceUrl && !/^https:\/\//.test(record.sourceUrl)) blocking.push('Invalid source URL');
      for(const key of ['date','introducedDate','since','until'] as const) {
        const value = (record as unknown as Record<string,unknown>)[key];
        if(value!==undefined && !toIsoDate(String(value))) blocking.push(`Invalid record ${key}`);
      }
    }
  }

  const counts = {
    questions: next.questions.length,
    interventions: next.interventions.length,
    bills: next.bills.length,
    attendance: next.attendance.length,
  };

  // Every record must carry provenance. This mirrors the type-level rule and
  // catches a parser that forgot to attach source refs.
  for (const q of next.questions) {
    if (q.sourceRefs.length === 0) blocking.push(`Question ${q.id} has no sourceRefs`);
    if (!q.date) warnings.push(`Question ${q.id} has no date`);
  }
  for (const i of next.interventions) {
    if (!i.sourceUrl) blocking.push(`Intervention ${i.id} has no sourceUrl`);
  }

  // Duplicate ids mean the id scheme is not actually unique, which would
  // corrupt every derived total.
  const dupes = findDuplicates([
    ...next.questions.map((q) => q.id),
    ...next.interventions.map((i) => i.id),
    ...next.bills.map((b) => b.id),
  ]);
  if (dupes.length > 0) blocking.push(`Duplicate record ids: ${dupes.slice(0, 5).join(', ')}`);

  // Attendance sanity: present days cannot exceed eligible days.
  for (const s of next.attendance) {
    for(const n of [s.presentDays,s.eligibleDays]) if(n!==undefined && (!Number.isSafeInteger(n)||n<0)) blocking.push(`Attendance ${s.session}: invalid day count`);
    if(s.percentage!==undefined && (!Number.isFinite(s.percentage)||s.percentage<0||s.percentage>100)) blocking.push('Invalid attendance percentage');
    if (
      typeof s.presentDays === 'number' &&
      typeof s.eligibleDays === 'number' &&
      s.presentDays > s.eligibleDays
    ) {
      blocking.push(`Attendance ${s.session}: presentDays exceeds eligibleDays`);
    }
  }

  if (previous) {
    const before = {
      questions: previous.questions.length,
      interventions: previous.interventions.length,
      bills: previous.bills.length,
      attendance: previous.attendance.length,
    };
    for (const key of Object.keys(counts) as (keyof typeof counts)[]) {
      if (before[key] > 0 && counts[key] === 0) {
        blocking.push(
          `${key}: had ${before[key]} records, now 0. Treating as a parser failure, not a real change.`,
        );
      } else if (before[key] > 4 && counts[key] < before[key] * 0.5) {
        blocking.push(`${key}: dropped from ${before[key]} to ${counts[key]}. Review before publishing.`);
      }
    }
  }

  return { ok: blocking.length === 0, blocking, warnings };
}

function findDuplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}
