# MP page: from register to civic story

## Before  -  visual and structural audit

Inspected the current route, full-page desktop/mobile captures, shared ledgers, record disclosures, sources and normalized datasets before editing. The page is factual but its composition follows storage: repeated label/explanation/row/source stacks. The PIN is just the first item in a list. The name is repeated in an adjacent identity plate. Cases occupy a separate long chapter. Parliament is a ledger of counts followed by dataset names. Public money foregrounds annual entitlement then repeats seven financial rows. An unimplemented “around you” chapter consumes space without records, and a long source register overwhelms the ending. Disclosure alone has not created an overview or a reason to explore.

## New hierarchy

1. **You live here**  -  oversized PIN, local place, constituency, schematic street-line motif explicitly not a map.
2. **This is your MP**  -  full name as a title spread, compact identity facts, no unlicensed portrait or repeated surname plate.
3. **The public record**  -  four disclosures together; exact amounts beside abbreviated typography; legal caveat travels with cases.
4. **In Parliament**  -  a lead question count and smaller participation strip, then question distribution by actual ministry labels. Detailed records live one level deeper.
5. **Attendance**  -  session strip with signed/attended fractions only where dates reconcile; no overall score.
6. **Public money**  -  recommendation → sanction → recorded expenditure, exact values and scope. Allocation is a separate annotation, not equated with recommendation. Full financial ledger remains accessible.
7. **Where did it go?**  -  only the report's categories: Normal/Others and Repair and Renovation in this snapshot. No inferred sectors or geocoded localities. Clearly explain the limit.
8. **A closer look**  -  four most recently recommended works, deterministic date/ID ordering, explicitly not a representative sample or performance selection. Full descriptions, source stages and missing-money states. All works remain accessible.
9. **The receipts**  -  three source families, retrieval dates, periods and links; technical request manifests moved to the source-detail view.
10. **Decide what it means**  -  quiet civic close, no persuasion.

## Composition and interaction

Keep Archivo, Archivo Black and Barlow Condensed with chalk, cobalt, ink and acid. Use full-width publication spreads, rules and deliberate changes in scale. No cards, new UI library or fabricated geographic illustration. A compact sticky chapter index provides orientation; native links/disclosures are keyboard accessible. No count-up animations that transiently display incorrect numbers, scroll-jacking or hidden facts. Honor reduced motion.

## Data boundaries

Reuse getProfile and existing civic models without changing ingestion, snapshots, values or provenance. Ministry grouping counts exact labels with whitespace trimmed only; it does not infer themes or intent. MPLADS categories are source labels, not invented infrastructure sectors. No work is assigned to PIN 400053. Missing sources/datasets retain unavailable states, never zero. Portrait permission is unresolved, so the title spread uses typography alone.

## Verification plan

Validate derived group totals and deterministic previews against actual records. Run existing parser/provenance tests, lint, typecheck and production build. Check main and deeper record views at 320, 375, 430, 768, 1024, 1280 and 1440 pixels, including expanded disclosures, long titles/source links, keyboard navigation, lookup and both MP aliases. Inspect screenshots of the place opener, Parliament and money, not only DOM bounds.

## Implementation

The story route now has ten chapters plus a ministry-pattern interlude. Added a dedicated `/mp/[slug]/records?view=…` inspection route for questions, debates, bills, committees, attendance, works, financials, affidavit details and sources. Both existing member aliases still work. Detail collections reuse ParliamentRecords, WorkRegister, FundLedger and SourceRegister. Existing data files, ingestion, repository and numbers were not edited during this redesign.

New small presentation primitives live in `components/civic/Story.tsx`. Derived ministry/category counts and deterministic four-work selection live in `lib/mp-story.ts`; tests check conservation of record totals, stable ordering and unchanged source objects. No chart library or portrait was added. Exact rupees accompany rounded display amounts. The money arrows describe administrative stages, not a Sankey or a claim that the same rupees reconcile across the three totals.

The chapter index is sticky on larger screens and stays in document flow on narrow screens so it cannot cover mobile headings. Native details and linked record views support keyboard use; no interaction requires hover. The source register and every stored record remain accessible one level deeper.

## Results

- `npm run lint`: passed with no warnings/errors.
- `npm run typecheck`: passed.
- `npm test`: 17 passed, including all existing ingestion tests and two new presentation-derivation tests.
- `npm run build`: production build passed; the new record route uses the existing dynamic repository.
- `node scripts/check-layout.mjs`: 98 route/view/width combinations passed with zero detected text overflow, clipping or grid-boundary violations. Covered 320, 375, 430, 768, 1024, 1280 and 1440 pixels, both MP aliases, all nine record views and existing home/constituency/methodology routes. Repeated against production with all disclosures expanded.
- Keyboard Enter opened the education disclosure. Navigation reached all 243 questions and all 67 works, with rendered totals checked against the unchanged profile API. PIN lookup, About redirect, valid/invalid API responses and absence of government requests from citizen pages passed.
- Reviewed desktop and mobile screenshots of place, MP, Parliament and money. Mobile chapter navigation was changed to non-sticky after visual review showed it could obscure headings. Isolated section captures also remove desktop sticky positioning to avoid screenshot artifacts.
- No portraits, data changes, ingestion requests, runtime dependencies or charts based on inferred classifications were added. The source-family heading says ECI, matching the actual stored affidavit citation; no ADR citation was invented.

## One remaining design weakness

The place opener is spatially suggestive but not geographically informative. Its linework is explicitly schematic. A verified constituency outline could make the opening more personal without pretending the work records have reliable coordinates.

## Second design pass  -  scroll to understand, tap to investigate

The ten-chapter version still exposed too much editorial scaffolding: folios, chapter navigation, upfront charts, source clusters and explanations. This pass replaces it with six unnumbered moments: place, MP, assets, questions, recommendations and sources. No cards, top-level work list, diagrams or repeated methodology decks remain. One primary native disclosure per moment opens the next layer. Exact monetary values remain visible next to the abbreviated display figures.

The palette is warm paper, near-black and cobalt; the main route uses only Archivo Black and Archivo. The site-wide header/footer are absent on this route, with a quiet home link instead. A non-interactive place marker appears in a reserved side margin after the opener. There is no sticky navigation and no animated counting or scrolling control.

Source buttons open native modal dialogs, styled as bottom sheets on mobile. They include source/report name, retrieval date, period, direct link and relevant caveats. Escape, focus containment and focus return use browser-native dialog behavior. Existing full source and methodology routes remain accessible. Source data is derived from the existing profile; no new civic facts or endpoints were introduced.

Parliament expands to the source's ministry labels. Tapping a label opens a filtered question collection, with the exact ministry displayed and a route back to all questions. Other parliamentary datasets remain accessible inside the disclosure. Assets reveal liabilities, declared cases with their legal caveat, and the original education wording. MPLADS reveals sanctioned amounts, recorded expenditure and work count before the complete work register. Missing, failed and stale states stay distinguishable from zero.

### Second-pass verification

Lint and TypeScript checks passed. All 17 tests passed, including exact-label ministry filtering and conservation of question counts. Production build passed. Browser verification passed 105 route/width combinations at the seven required widths with disclosures expanded; the main page has six moments and no folios/navigation bar/work previews. Source dialogs were opened at every width and checked for horizontal overflow; Escape and focus return passed. Ministry → 22 Railways questions → all 243 questions → all 67 works navigation passed, as did existing lookup and redirect checks. No citizen-page government requests were observed.

The standalone HTML was refreshed with embedded fonts/styles and a small offline interaction handler. With all HTTP(S) requests blocked, source sheets opened, Railways filtered to 22 records, returning to all questions displayed 243, and the work register displayed 67. The export is a saved review snapshot, not a live feed or lookup service.

The underlying raw/normalized data, repository and ingestion adapters were unchanged. Remaining source gaps are preserved in contextual evidence and the deeper record views. Visual review also corrected the browser's default dialog max-width so the mobile source sheet fills the screen.

## Third design pass  -  documentary photography

Added exactly three licensed photographs through a small `StoryImage` component: Andheri West station, the Lok Sabha chamber and Andheri Sports Complex. All six existing moments remain. The photographs precede facts; no factual text overlays image pixels. Original JPEGs stay unchanged, while CSS applies grayscale and separately specified desktop/mobile crops. The local station sign, chamber chair and stadium tower remain visible. Captions and keyboard-operable credits expose subjects, dates, authors, licenses and modifications. The sports caption explicitly disclaims a documented MPLADS connection. See [PHOTOGRAPHY](PHOTOGRAPHY.md) for rights evidence, focal positions and the single contextual-association risk.

Parliament's opened details now use a plain paper background. All civic data and source dialogs remain as before. The export script now embeds the three JPEGs alongside fonts/styles, retaining captions and license links.

Verification: lint and typecheck passed, all 18 unit tests passed (including original-image hash and rights-evidence checks), and the production build passed. Browser checks passed 105 route/width combinations across 320, 375, 430, 768, 1024, 1280 and 1440px with all disclosures open. They also verified three loaded images, visible contextual labeling, keyboard photo credits, source dialog focus return and ministry/record navigation. Desktop/mobile screenshots of every photographic section were reviewed. No data or ingestion changes were made.

The refreshed 3.70 MB standalone review HTML passed with HTTP(S) blocked: all three embedded photographs decoded, source sheets opened, 22 Railways questions filtered correctly, all 243 questions returned and all 67 works rendered.
