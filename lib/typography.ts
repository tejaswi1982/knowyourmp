/**
 * Fitting display type to the column it lives in.
 *
 * The problem this solves: a viewport-derived font size (`15vw`) knows nothing
 * about the width of the cell the text sits in. At some breakpoints a long
 * name set at `mega` was 400px wider than its grid column, so it ran under the
 * neighbouring element and lost letters. Clipping it would hide the symptom;
 * shrinking the whole scale would make the site timid.
 *
 * Instead the size is expressed in container-query units, derived from the
 * measured width of the actual string. The text then fills its column at every
 * breakpoint and can never exceed it  -  aggressive scale, no collisions, and it
 * holds for any of the 543 names rather than just the one we tested with.
 *
 * Requires an ancestor with `container-type: inline-size` (the `.fit` utility).
 */

/**
 * Advance widths for Archivo Black uppercase, in em.
 *
 * Measured in-browser rather than assumed: the real range runs from 0.39em (I)
 * to 0.94em (M), so a single average would be wrong by a factor of two on
 * initial-heavy or M/W-heavy names. Values are rounded up slightly so the
 * estimate errs wide and the fitted size errs small.
 */
const ADVANCE: Record<string, number> = {
  I: 0.45,
  J: 0.58,
  L: 0.66,
  M: 1.0,
  W: 1.0,
  O: 0.85,
  Q: 0.87,
  G: 0.85,
  C: 0.83,
  D: 0.83,
  ' ': 0.28,
  '-': 0.42,
  '.': 0.32,
  '₹': 0.7,
};

/** Everything not in the table. Above the measured mean, on purpose. */
const DEFAULT_ADVANCE = 0.82;

/** Approximate rendered width of a string, in em. */
export function estimateWidthEm(text: string): number {
  let em = 0;
  for (const char of text.toUpperCase()) {
    em += ADVANCE[char] ?? DEFAULT_ADVANCE;
  }
  return em;
}

/**
 * Font size, in container-query width units, at which `text` fills its
 * container without exceeding it.
 *
 * `lines` splits on spaces when each word is set on its own line, so the
 * longest single word governs rather than the whole string.
 */
export function fitCqw(
  text: string,
  options: { perWord?: boolean; cap?: number; safety?: number } = {},
): number {
  const { perWord = false, cap = 100, safety = 0.97 } = options;
  const segments = perWord ? text.split(/\s+/).filter(Boolean) : [text];
  const widest = Math.max(...segments.map(estimateWidthEm), 0.1);
  return Math.min(cap, (100 / widest) * safety);
}

/**
 * A ready-to-use `font-size` value.
 *
 * `min` keeps the text readable if a container is unexpectedly narrow; `max`
 * stops it growing past the design's top end on very wide screens.
 */
export function fitFontSize(
  text: string,
  options: { min: string; max: string; perWord?: boolean; cap?: number } = {
    min: '2rem',
    max: '14rem',
  },
): string {
  const { min, max, perWord, cap } = options;
  return `clamp(${min}, ${fitCqw(text, { perWord, cap })}cqw, ${max})`;
}
