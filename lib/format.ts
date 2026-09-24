import type { Availability, Metric } from '@/types/civic';

/**
 * Display formatting.
 *
 * Rupee figures are shown twice over: once in the Indian digit grouping that
 * matches the source document, and once in crore/lakh, which is how the amount
 * is actually spoken about. Neither is rounded away.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const PLAIN = new Intl.NumberFormat('en-IN');

/** Exact rupees, Indian grouping: ₹54,50,49,854 */
export function formatRupees(value: number): string {
  return INR.format(value);
}

/**
 * The same amount in the unit people speak in: "₹54.50 crore".
 * Returns null below one lakh, where the exact figure already reads fine.
 */
export function formatNumber(value: number): string {
  return PLAIN.format(value);
}

/**
 * Split a rupee figure into display parts so a number can be set as typography
 * rather than as a string: `{ symbol: '₹', amount: '54.5', unit: 'CR' }`.
 *
 * The exact figure is never lost  -  callers pair this with `formatRupees()` in
 * the caption, so the rounded headline always has the precise value beside it.
 */
export function splitRupees(value: number): {
  symbol: string;
  amount: string;
  unit: string | null;
} {
  const CRORE = 10_000_000;
  const LAKH = 100_000;
  const abs = Math.abs(value);

  if (abs >= CRORE) {
    const n = value / CRORE;
    // Drop a trailing zero: 54.50 reads better as 54.5 at display size.
    return { symbol: '₹', amount: trimZero(n.toFixed(2)), unit: 'CR' };
  }
  if (abs >= LAKH) {
    return { symbol: '₹', amount: trimZero((value / LAKH).toFixed(2)), unit: 'LAKH' };
  }
  return { symbol: '₹', amount: PLAIN.format(value), unit: null };
}

function trimZero(s: string): string {
  return s.replace(/\.?0+$/, '');
}

/** Render a metric's value, or the honest placeholder for its state. */
export function formatMetricValue(metric: Metric): string {
  if (metric.value === null || metric.value === undefined) {
    return placeholderFor(metric.availability);
  }
  switch (metric.format) {
    case 'currency-inr':
      return typeof metric.value === 'number' ? formatRupees(metric.value) : String(metric.value);
    case 'number':
      return typeof metric.value === 'number' ? formatNumber(metric.value) : String(metric.value);
    case 'percent':
      return typeof metric.value === 'number' ? `${metric.value}%` : String(metric.value);
    case 'text':
    default:
      return String(metric.value);
  }
}

/**
 * The placeholder for a figure that has no value.
 *
 * Keep missing figures distinct from zero and from a confirmed empty record.
 */
function placeholderFor(availability: Availability): string {
  switch (availability) {
    case 'published': return 'Not supplied';
    case 'pending': return 'Not yet integrated';
    case 'source-unavailable': return 'Source unavailable';
    case 'unavailable': return 'Not published';
    case 'no-data': return 'No data available';
    case 'demo': return 'Demo data';
    default: return 'Data unavailable';
  }
}

/** "17 August 2026" */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** "17.08.26"  -  compact enough for a source chip, still a full date. */
export function formatDateStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}
