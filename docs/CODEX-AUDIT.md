# Repository audit  -  20 September 2026

Written before application edits. This is a takeover audit, not a claim that inherited civic figures have been independently reverified.

## 1. Current architecture

Next.js 14.2.15 App Router, React/React DOM 18.3.1, TypeScript 5.5.4 (strict), Tailwind 3.4.10, PostCSS 8.4.39, Autoprefixer 10.4.19. Installed dependencies and a package lock exist. Node on this machine is 24.14.1. No Git repository, AGENTS.md, environment files, test suite, CI, database, scheduler, or ESLint configuration was found in the project.

Server pages: `/`, `/mp/[slug]` (member and constituency aliases), `/constituency/[slug]`, `/methodology`, `/about` (permanent redirect), and not-found. JSON routes: `/api/mps` (including PIN/locality lookup) and `/api/mps/[slug]`. Dynamic profile/constituency paths have static parameter generation. `PinLookup` is the main client component; it uses local lookup and delayed navigation. Geolocation requests coordinates but explicitly does not resolve them.

`types/civic.ts` contains reusable identity, affidavit, financial, parliamentary record and snapshot types. `data/mps/index.ts` assembles seeds into profiles and derives parliamentary counts with `lib/parliament.ts`. `lib/repository.ts` exposes async in-memory access. Pages also import source/geography registries directly; the documented repository-only boundary is not completely enforced. Client lookup imports the profile registry, potentially bundling future large records into the client.

Components are civic-specific: identity plate, typography/data expressions, activity/fund/work registers, evidence links, PIN lookup, header/footer. No component framework. CSS uses a 12-column grid, responsive frame, custom type scale, container query sizing and ink/chalk/acid/cobalt palette. Archivo Black, Archivo and Barlow Condensed load through next/font/google, requiring network at a clean build. Metadata uses a placeholder `.example` domain.

Scripts: dev, build, start, lint, typecheck. Baseline `npm run typecheck`: passed. Baseline lint: failed to run noninteractively because ESLint is unconfigured. No test script. Existing README's prior browser/contrast verification is an inherited assertion, not evidence from this audit.

## 2. Current data flow

| Page/section | Origin/state |
| --- | --- |
| Home identity/seat | Imported static seed via repository; one profile |
| Home/footer/methodology coverage | Calculated registry length and hardcoded 543 denominator |
| PIN/locality resolution | Static registry: six PINs, locality/segment strings; substring matching also accepts overly broad input |
| MP orientation/identity | Static seed: Ravindra Dattaram Waikar, Shiv Sena, Mumbai North-West, MH-27, 18LS/2024 |
| Public record | Static, marked published: Graduate; education text; assets ₹54,50,49,854; liabilities ₹4,48,10,574; 3 declared pending cases |
| Parliament | Empty seed record arrays; derived null/pending totals; no live records, committees empty |
| Public money | Static published scheme entitlement ₹5 crore/year; hero duplicates this as hardcoded text; recommended/sanctioned/spent/balance null/pending |
| Works/around you | Empty, deliberately; no mock projects remain |
| Sources | Static registry, inherited retrieval dates 2026-08-17 |
| Constituency | Static segments, localities, PIN mapping; AC 165 is not represented in the model |
| Methodology | Hardcoded editorial/counting explanations plus registry-derived sources/coverage |
| JSON APIs | Same assembled seed profiles and lookup; no external fetch |

Duplicate affidavit facts also appear in representative.recordSummary. Preserve their values; do not silently substitute findings from research. No live civic datasets are connected. No displayed mock records were found.

## 3. Current factual sources

Identity/party/election: `eci-result-2024` (results portal root) and `lok-sabha-member-profile` (members index). Affidavit/education/assets/liabilities/cases: `eci-affidavit-2024` (affidavit portal root, exact document pending). Seed comments assert human review, but no affidavit snapshot or precise record is retained to substantiate that assertion.

Parliament: `digital-sansad-activity` points to the Lok Sabha portal root. MPLADS entitlement: guidelines PDF marked exact; expenditure and works point to MPLADS root. Geography: India Post PIN page and ECI delimitation landing page. These citations are references to intended sources, not all verified record-level evidence. Existing values and original retrieval dates must not be relabelled as newly verified.

`SourceReference` has publisher/title/URL/period/retrieval date/deep-link state, but no official flag or parser version. Record sourceRefs can be empty despite comments claiming type enforcement. Resolution silently drops unknown source IDs. SourceFootnote uses the first source's date for all sources.

## 4. Design issues (source inspection; rendered verification follows)

- Body has `overflow-x-clip`, concealing factual overflow globally.
- MP hero already stacks through tablet and uses container-based sizing; preserve this improvement. Minimum sizes, fallback font metrics and 0.9 line-height still need rendered verification at every requested width.
- IdentityPlate no longer has an overflow-hidden surname container or negative-margin crop class, but has nowrap/minimum-size risks and stale comments claiming cropping. Full names must stay selectable/legible.
- Home holdings headings set `.fit` and cqw font size on the same element; cqw resolves to an ancestor, not that element's own container, risking long-heading overflow.
- Hero monetary figures still use viewport sizing inside narrow grid columns; source links and labels need wrapping checks.
- Semantic names and lookup results use clip-path reveal/wipe animations. Never clip factual text, even temporarily.
- PIN input is oversized relative to its tablet column; long locality input is visually obscured by single-line input behavior.
- Header uses fixed height and tightly packed navigation at 320px. Activity rows and work rows use opposing flex children without adequate narrow-width treatment.
- Placeholder text uses 15 to 20% opacity, too faint against its background. `slate` token's comment claims contrast on both grounds without substantiation; no usage found.
- Decorative duplicated ticker clipping is intentional, but factual civic identifiers should not depend on this strip for access.
- No factual absolute-positioned overlays found; IdentityPlate's absolute registration grid is decorative and aria-hidden.

## 5. Integration status

Digital Sansad: member ID 5701 exists. All six ENDPOINTS are null. Client snapshots then returns a payload only if configured; all five dataset parsers throw NotConnectedError. Models and deduplicated counting logic exist. No question/attendance/debate/bill/committee payloads, CLI, normalized store, or scheduled runs.

MPLADS: summary/works REPORTS both null. Summary/work parsers throw. `toFundSummary` maps optional numbers but drops released/entitlement fields and lacks validation. Member ID unknown; client currently does not enforce it. WebForms comments are hypotheses about a legacy system, not observed current flow. No report payloads or records.

Shared snapshot helper saves text + URL/time/parser/SHA-256/status/content-type. It has no timeout, binary retention, request method/body provenance or source identifier. Identical responses overwrite manifest timestamps despite an immutability claim. No publication transaction or last-good storage exists.

## 6. Technical and factual risks

1. Static published affidavit details cannot yet be independently checked against their cited root URLs. Flag discrepancies before replacement.
2. Empty records mean pending, which is safe before integration but cannot represent a verified zero or complete versus partial coverage.
3. Attendance aggregation ignores missing denominators but accepts negative/NaN values and lacks dataset-scope compatibility checks.
4. Date helper accepts partial/ambiguous dates contrary to its comment. Validation checks only a subset of provenance and negative/date constraints.
5. No atomic normalized publication; a future failed run could accidentally replace good data if added carelessly.
6. Hardcoded Parliament “Not connected yet” and “Around you” copy will need state-driven rendering when records arrive.
7. Exact-source status and broad statements about portrait licensing are not independently established.
8. PIN substring matching can return an MP for a single letter or punctuation; mapping remains approximate and must retain its caveat.
9. Package versions are old; dependency/security assessment is separate from this baseline architecture audit. Do not perform an unproven major framework migration.
10. No version-control recovery in this directory. Keep changes small and retain inherited seed values.

## Planned sequence

Repair factual layout without rebuilding; verify requested widths; investigate actual official sources; implement only observed contracts; retain raw responses; validate and publish via repository; preserve pending states for blocked datasets; add targeted tests and exact operating/source documentation. Research and final verification findings will be recorded separately in DATA-SOURCES.md and this audit's follow-up notes.

## Follow-up: implementation and verification, 2026-09-20

The preceding sections preserve the pre-change audit. This follow-up records the completed pass rather than rewriting its baseline findings.

### Design and neutral presentation

Removed global horizontal clipping, kept factual names outside reveal masks, allowed identity/header text to wrap, sized money and headings to their own containers, and repaired narrow PIN input/result layouts. Grid children can shrink and long source URLs/identifiers wrap. The only remaining overflow-hidden component is an aria-hidden decorative ticker. Source labels, complete work descriptions, exact money, session dates and report conflicts remain readable in disclosures. No data was removed to make a layout fit.

The expanded parliamentary and public-money chapters reuse the existing visual system. Added record disclosures and explicit partial/stale/failure messages, not scores or ratings. Removed inherited judgmental spending copy and unsupported blanket image-licensing / human-verification claims. Original affidavit numbers remain unchanged. Lookup no longer matches single-letter substrings.

### Data and architecture

Kept Next App Router, existing civic types, repository boundary and counting utilities. Connected two CLI ingestion adapters after inspecting actual official website bundles and making direct official requests. Added retained raw bytes/request manifests, strict runtime parsers, atomic checksummed normalized publication, source status and last-good fallback. Frontend requests read local data. No government calls run on a citizen request and no machine scheduler was installed.

Digital Sansad: 243 questions, 51 debate participation records, 3 private bill introductions, 3 committee terms and 7 session attendance records. Session 7 date sets disagree, and the calendar omits session 8 represented in questions; no aggregate attendance figure is published.

MPLADS: 67 recommended works, 46 sanctioned rows and 24 expenditure transactions joined into 67 unique works. Exact report sums: recommendation/allocation ₹14,70,00,000; sanction ₹9,80,00,000; expenditure ₹5,37,99,122. Twenty work stages conflict between source reports; both values are disclosed. Reporting cut-off, release, balance, utilization, coordinates and PIN mapping remain unavailable.

Exact requests, identity checks, response shapes and limitations are in DATA-SOURCES.md. The initial seed's source retrieval dates are not replaced with today's date. Identity gains a separate official biography citation; it does not acquire an affidavit verification claim.

### Verification and remaining risks

- `npm run lint`: pass, no warnings/errors.
- `npm run typecheck`: pass.
- `npm test`: 15 passing tests, including official fixtures, malformed payloads, duplicate/identity/date/money rejection, conflicting attendance, byte hashes and pending-not-zero behavior.
- `npm run build`: production build passed. The prerender manifest confirms MP/API/methodology read paths are not static snapshot pages despite Next 14's generated-params route table symbol.
- Both ingestion commands passed dry-run and published independently against live official sources; raw evidence and normalized snapshots are retained.
- Layout evidence is in layout-check.json and screenshots/. Tests inspect text bounds, grid boundaries and clipping ancestors with all disclosures open across four routes and seven widths. This checks geometry, not a complete accessibility certification.
- `npm audit --offline=false --json`: five unresolved advisories (four high, one critical), including Next.js Windows-hosted RCE advisory GHSA-p293-qw3h-jr36. Inherited Next 14.2.15 / related dependencies need a supported patched upgrade. No public deployment was performed. Sandboxed cached audit output incorrectly reported zero; the live network audit was used instead.
- Exact affidavit and locality documents and portrait permission remain unverified. The biography education description differs in detail from the affidavit seed, which was retained.
- Government endpoint contracts are undocumented and may change; last-good fallback reduces outage impact but cannot resolve incorrect source records. Disk snapshots require persistent storage and serialized update jobs in production.
- The supplied directory has no .git, so no commit or Git diff is available.

Final browser run: `node scripts/check-layout.mjs` passed all 28 route/width combinations with zero detected factual text overflows or grid collisions. PIN 400053 navigated to the member page; `/about` redirected to methodology; valid/invalid lookup API statuses were 200/404. No government-network requests were emitted by citizen pages during the run. Production server was used for this verification.

## Final pre-launch QC update - 24 September 2026

- The existing app structure, adapters, immutable raw government snapshots and normalized civic records were retained. Current changes are recorded in the repository history only if the owner initializes Git; this directory has no `.git` metadata.
- Mapped PINs are now carried as an allow-listed query parameter from the homepage into the MP story and works directory. The story's PIN and locality come from the existing seat registry; unsupported query strings fall back to the documented demo PIN.
- Site metadata now uses `https://knowyourmp.abhinandantejaswi.com`, with a project-specific social image, SVG favicon and touch icon. A sitemap includes public information routes; robots excludes API and admin routes, and contribution forms carry no-index metadata.
- Footer has subtle project-owner website and LinkedIn links, plus site-use and privacy routes. Privacy text reflects the actual anonymous contribution form, essential receipt cookie, media handling and present removal/contact limitations. No analytics or non-essential cookies were found; no consent banner was added.
- Exact U+2014 em dash punctuation was removed from source-controlled editorial UI, docs, scripts and source attribution text. Raw government responses and normalized snapshots remain byte-for-byte unchanged.
- Dependency audit required updating Next.js to 15.5.26, its matching ESLint config, Sharp 0.35.4, and pinning the safe PostCSS tree. `npm audit` then reported zero known vulnerabilities. Upstream announced another security release for 30 September 2026, so rerun the audit before launch.
- The app still needs production operations before citizen evidence is publicly opened: durable private storage, authenticated moderator access, retention/deletion process, malware scanning, abuse controls, backups, monitoring and a public correction/removal contact.
- The live target hostname did not resolve during a read-only HTTPS check on 24 September 2026. DNS/TLS and deployed asset/link checks remain an external action; no DNS or hosting configuration was changed.
- Data verification did not update official records. Current public MP/party/seat were checked against the official member biography. Affidavit candidate document, education mismatch, constituency PIN references, attendance calendar gaps, MPLADS reporting cut-off and 20 conflicting work statuses remain disclosed limitations.
- Final checks: `npm run lint`, `npm run typecheck`, `npm test` (24 passed), `npm audit` (zero known vulnerabilities), `npm run build`, `npm run test:civic` (both submission loops and 30 viewport checks), `npm run test:layout` (105 route/width checks), and `node scripts/check-homepage.mjs` (9 widths, six PINs and 54 invalid-input cases) passed. Both offline review exports were regenerated and verified.
- Production-route check returned HTTP 200 for all 74 sitemap entries, including all 67 published works. `robots.txt`, canonical metadata, favicon and social image were served by the local production build. The target deployment domain still does not resolve from this environment.
