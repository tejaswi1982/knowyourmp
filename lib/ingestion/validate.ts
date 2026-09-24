import { ValidationError } from './core';

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ValidationError(message);
}
export function object(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'Expected an object');
  return value as Record<string, unknown>;
}
export function array(value: unknown): unknown[] {
  assert(Array.isArray(value), 'Expected an array');
  return value;
}
export function text(value: unknown): string {
  assert(typeof value === 'string' && value.trim().length > 0, 'Expected nonempty text');
  return value; // Official wording is retained verbatim.
}
export function integer(value: unknown): number {
  assert(typeof value === 'number' || typeof value === 'string' && /^\d+$/.test(value), 'Expected integer');
  const n = Number(value);
  assert(Number.isSafeInteger(n) && n >= 0, 'Invalid nonnegative integer');
  return n;
}
export function officialUrl(value: unknown): string {
  const u = new URL(text(value));
  assert(u.protocol === 'https:' && ['sansad.in','mplads.mospi.gov.in'].includes(u.hostname), 'Unexpected source URL');
  return u.href;
}
/** Parse only complete observed formats; reject rollover and ambiguous dates. */
export function date(value: unknown): string {
  const s = text(value);
  let iso = '';
  if (/^\d{4}-\d{2}-\d{2}(?:$|[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$)/.test(s)) iso = s.slice(0,10);
  const dmy = /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(s);
  if (dmy) iso = `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const named = /^(\d{2})-([A-Z][a-z]{2})-(\d{4})$/.exec(s);
  if (named) {
    const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(named[2])+1;
    assert(month > 0, 'Unknown month');
    iso = `${named[3]}-${String(month).padStart(2,'0')}-${named[1]}`;
  }
  assert(iso && !Number.isNaN(Date.parse(iso)) && new Date(iso).toISOString().slice(0,10) === iso, `Invalid date: ${s}`);
  return iso;
}
export function unique<T>(rows: T[], key: (row: T) => string): T[] {
  const seen = new Map<string, T>();
  for (const row of rows) {
    const id = key(row);
    assert(id && !seen.has(id), `Duplicate record ID: ${id}`);
    seen.set(id, row);
  }
  return [...seen.values()];
}
/** Exact rupees, maximum two decimal places; no permissive parseFloat. */
export function money(value: unknown): number {
  if (typeof value === 'number') {
    assert(Number.isFinite(value) && value >= 0 && Number.isSafeInteger(Math.round(value*100)) && Math.abs(value*100-Math.round(value*100)) < 0.00001, 'Invalid monetary number');
    return value;
  }
  let s = text(value).trim().replace(/^(?:₹|Rs\.?|�)\s*/, '');
  assert(/^(?:\d+|\d{1,2}(?:,\d{2})*,\d{3}|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(s), `Invalid rupee value: ${s}`);
  s = s.replace(/,/g,'');
  const [whole, fraction=''] = s.split('.');
  const paise = BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
  assert(paise <= BigInt(Number.MAX_SAFE_INTEGER), 'Monetary value exceeds safe precision');
  return Number(paise)/100;
}
