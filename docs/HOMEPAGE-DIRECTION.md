# Homepage direction

## Chosen concept

One photographic front door: a quiet brand at the upper left, then “Enter your PIN code” and one underlined field in the road foreground. “Find your MP” leads directly into the existing six-moment story. A small pilot-coverage line, Methodology link and photo credit complete the screen.

## Image treatment and rights

**Andheri flyover on the Western Express Highway**, by **Rsrikanth05**, **15 January 2010**. Concrete spans and road provide everyday civic context and a quiet foreground. This is historical photography, not evidence of current conditions or MPLADS funding.

- [Original and rights evidence](https://commons.wikimedia.org/wiki/File:Andheri-Flyover.jpg).
- Selected license: [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Original JPEG: `public/story/andheri-flyover.jpg`, 1600 × 1200, 431,987 bytes.
- Source-page HTML, original URL, retrieval time, creator, date, license and SHA-256 are retained in `data/photography/`.

CSS grayscale and a graduated dark overlay unify tones; original bytes remain unchanged. Expandable photo credit exposes the date, creator, original, license and alterations. The photographic adaptation uses the original license. No placeholder, stock substitution or generated photograph was needed.

## Typography and overlay logic

The existing Archivo family uses regular-weight, sentence-case text and tabular PIN digits. No new fonts or colours were introduced. Cobalt is reserved for text selection; focus outlines use warm white.

The form sits low over the road, away from the receding concrete structure. The brand has a separate graduated dark area at the top. Desktop pairs a broad instruction with a horizontal field/action row. Mobile keeps that pairing at a smaller scale. Only photographic pixels occupy the crop; labels, controls, errors and credits are in normal flow. An expanded credit uses solid ink behind its text.

## Mobile behavior

Desktop focal position is **50% / 100%**; mobile is **62% / 100%**, retaining the structure and foreground. Below 375px, slightly smaller digits and action text keep the field and button together. The single-line instruction and compact form move the text into the quieter road area. The page uses `100svh` and can grow/scroll for errors, credits or zoom. No fixed panel obscures controls.

The input uses text type, numeric input mode and postal-code autocomplete. It supports normal editing and paste without six separate fields or silently truncating a longer pasted value. Actual iOS/Android keyboard behavior has not been tested on physical devices.

## Interaction behavior and coverage

Submission validates six digits starting with a non-zero digit, then calls the existing `lookup()` and `lookupHref()`. Malformed input and unsupported PINs have distinct messages. Errors focus the field, set `aria-invalid` and announce through a live region; editing clears them. Keyboard Enter submits. A React transition exposes an opening state and prevents repeated submissions without adding a delay.

“Mumbai North-West pilot · e.g. 400053” makes limited coverage discoverable. All six previously mapped PINs remain supported. Unsupported PINs never redirect to an unrelated MP. The story retains its original sample PIN and locality display; no new PIN-boundary verification or personalised story mapping is claimed.

The local photograph is eager and high priority. If it fails, a dark background keeps the form usable. A two-pixel arrow hover is the only motion, suppressed by existing reduced-motion rules. Native photo credits support keyboard use. No civic facts, repository code, ingestion adapters or MP-story components were changed.

## Deliberately removed

The homepage is a single photographic PIN entrance. The form has no demo-fill or geolocation buttons, locality-name instructions, or delayed coordinate animation. Locality lookup remains available in the shared resolver/API; this entrance is PIN-only. All six mapped PINs are carried into the MP story and displayed with their associated locality label.

## Portable review

`node scripts/export-review.mjs` now opens on the homepage and embeds its photograph alongside the story, sources and records. Offline pilot PINs are derived from the profile and verified through the local lookup API when exporting. The file clearly identifies itself as a saved review snapshot.

## Validation

- Lint and TypeScript checks passed; all 18 existing tests passed, including the new photograph's original-byte and license-evidence checks.
- `node scripts/check-homepage.mjs`: nine viewports passed, covering 320, 375, 430, 768, 1024, 1280 and 1440px plus 844×390 and 375×500. All six mapped PINs, 54 malformed/unsupported-input cases, keyboard submission, credit disclosure, Methodology navigation and image-load failure passed.
- The form and action fit on the first screen at each tested size. Six entered digits fit without scrolling inside the input. Desktop and mobile screenshots were reviewed.
- Contrast was sampled against the actual composited photograph, with the interface made transparent for the background capture. Every tested text/control region met its threshold: at least 3:1 for large text and 4.5:1 for small text. The lowest sampled large-text ratio was 3.54:1; the lowest small-text ratio was 6.30:1. This covers the tested default layouts, not every possible device/zoom/error state.
- `node scripts/check-layout.mjs`: all 105 route/width combinations passed with disclosures expanded; no detected horizontal overflow or factual-text clipping. The existing story and detailed-record navigation passed unchanged.
- `npm run build`: passed. `node scripts/export-review.mjs`: the 4.28 MB artifact passed with HTTP(S) blocked, including homepage PIN validation and entry, four embedded photos, 243 questions, 22 Railways-filtered questions, 67 works and navigation back home. Its six offline PIN mappings were verified against the local lookup API during export.

## One remaining visual risk

The 2010 photograph has modest resolution and a historical construction setting. Its geometry suits the composition; a commissioned contemporary photograph with the same open foreground could make it more distinctive. Any replacement needs verified location, permission and a tested text-safe area.
