# KnowYourMP

A non-partisan civic-information MVP for Andheri West / Mumbai North-West (PIN 400053), built with Next.js App Router, React, TypeScript and Tailwind. Existing architecture and affidavit figures are retained. No scores, rankings or fabricated public works.

## Development

The first participation loop is now available for the existing pilot: `400053 → MP → public money → /works → /works/[id] → verify → moderation → published citizen check`. All **67** real works are available, across Mumbai North-West; they are not mapped to this PIN. The homepage and MP story retain their design, with a works link and local Follow 400053 control.

Citizen participation requires **Node 24.14+**, persistent local storage and `CIVIC_ADMIN_TOKEN` (32+ random characters) in `.env.local` to access `/admin/contributions`. The framework and image-processing dependencies have been updated to patched releases; see the remaining single-host pilot requirements in [contribution setup and moderation](docs/CITIZEN-CONTRIBUTIONS.md), [data audit](docs/CIVIC-PARTICIPATION-AUDIT.md), [four-layer public work model](docs/PUBLIC-WORK-MODEL.md) and [civic constitution](docs/CIVIC-CONSTITUTION.md). Citizen evidence lives in a separate ignored SQLite store and never changes government snapshots.

Use Node.js 24.14+ for citizen-contribution storage (built-in SQLite).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The MP story uses six minimal moments with tap-to-reveal details and source sheets; the selected mapped PIN stays in the URL and is reflected accurately in the story. Inspect detailed records at `/mp/mumbai-north-west/records?view=questions` (also works, money, attendance, interventions, bills, committees, affidavit and sources). Main routes: `/`, `/mp/mumbai-north-west`, `/mp/ravindra-waikar`, `/constituency/mumbai-north-west`, `/methodology`, `/site-use`, `/privacy`, `/works`; `/about` redirects to methodology. `GET /api/mps?pin=400053` serves the local lookup.

No API keys or environment variables are required for the public-source adapters. Contribution moderation requires the server admin token described above. This is a single-constituency MVP; device geolocation is not connected. PIN mappings are approximate, not an electoral-roll determination.

## Homepage

The homepage is now a single photographic PIN entrance. See [HOMEPAGE-DIRECTION](docs/HOMEPAGE-DIRECTION.md) for composition, licensing, mobile behavior and the limits of pilot coverage. Run `node scripts/check-homepage.mjs` with the local server running to check nine viewport sizes, PIN validation, keyboard entry, photo fallback and contrast over the actual image.

## Data

Digital Sansad member **5701** is verified against its official biography before ingestion. The adapter fetches all question and debate pages, private bill introductions, committee terms, session calendars and attendance. Counts come from individual records, not manually entered totals. Answers are linked official PDFs when inline answer text is absent. Attendance is session-level; incompatible calendars never produce a percentage.

## MPLADS

The current public dashboard uses JSON POST requests, not the legacy WebForms flow. Its selector chain identifies Maharashtra 21, constituency 270, MP 3042793, House 2 and tenure 7 (18th Lok Sabha). Each run re-verifies this chain, retrieves financial tiles and recommendation/sanction/expenditure reports, and reconciles rows and sums.

Allocation, annual scheme entitlement, recommendation, sanction, release and expenditure remain distinct. Work statuses that disagree across reports are shown with both source values. Missing expenditure for a work is unavailable, not zero. No generated example projects are displayed.

## Sources

See [DATA-SOURCES](docs/DATA-SOURCES.md) for exact observed requests, response contracts and limitations, and [the initial audit and follow-up](docs/CODEX-AUDIT.md).

- Identity: inherited seed plus official Digital Sansad biography.
- Affidavit: inherited ECI / MyNeta / ADR citations; exact candidate-document verification remains outstanding. Existing education, assets, liabilities and declared-case values were not replaced.
- Parliamentary records: Digital Sansad official responses.
- MPLADS financials and works: MoSPI public dashboard reports.
- Annual entitlement and locality mapping: inherited scheme / delimitation references, separately identified from the live tenure totals.

The UI includes source links, retrieval dates, reporting scope and source conflicts. Its source register exposes methods, POST parameters, parser versions and raw hashes. POST endpoints are presented as reproducible requests rather than misleading browser GET links.

## Civic journey review

The current participation review is `exports/KnowYourMP-civic-loop-review.html`. It includes the homepage, MP story and visible public-money CTA, all 67 works, demo work **244718**, all five verification steps, photo upload/preview, pending confirmation, moderator states, published citizen checks, supporting documents and sources. It is an offline visual sequence of actual rendered states at **375 px and 430 px**, with review-only navigation; it is not a live submission form. Test evidence is visibly labelled and stored separately from real contributions.

After `npm run build`, regenerate with `node scripts/export-civic-review.mjs`. It starts and stops an isolated loopback production server, creates disposable fixture evidence through the real forms and verifies offline review navigation. See [CIVIC-JOURNEY-REVIEW](docs/CIVIC-JOURNEY-REVIEW.md). The older `KnowYourMP-review.html` is the prior story-only export and does not represent the participation loop.

For a manual local review, `node scripts/serve-civic-review.mjs` runs the app on port 3199 with a separate ignored review store; add `--production` after a build. Its generated local admin token is in `data/participation/journey-review/admin-token.txt`. This token is never embedded in the HTML review.

## Photography

The MP story uses three locally stored, licensed documentary photographs. Captions and expandable credits identify the creator, date, license and original source; the sports-complex image is explicitly contextual, not a documented MPLADS work. See [photography decisions and crops](docs/PHOTOGRAPHY.md) and [asset licenses](public/story/LICENSES.md). Original-image hashes and source-page evidence live in `data/photography/`. Civic ingestion never downloads images. To regenerate the self-contained review HTML while the local app is running, use `node scripts/export-review.mjs`; it embeds photos/fonts/styles and verifies navigation with network access blocked.

## Updating data

```sh
npm run ingest:sansad -- --member 5701 --dry-run
npm run ingest:mplads -- --member 5701 --dry-run
npm run ingest:sansad -- --member 5701
npm run ingest:mplads -- --member 5701
```

Dry-run retains raw evidence and validates everything but does not publish a normalized snapshot or update its status. Only member 5701 is supported. Requests are sequential with a 30-second timeout; failed runs exit nonzero. No credentials or user sessions are required.

Pipeline: official response -> immutable `data/raw/<source>/` bytes + manifest -> strict parser and validation -> checksummed `data/normalized/<source>.json` -> repository -> frontend. Successful later publications also retain a content-addressed normalized history. Raw manifests retain URL, method, body, source identifier, retrieval timestamp, parser version and SHA-256. Failed updates preserve the last good snapshot and write a separate status. Raw and normalized evidence should travel with deployments and backups.

Run updates as a weekly scheduled job with persistent storage, no overlapping runs, and nonzero-exit monitoring. No machine scheduler is installed by this repository. The website never fetches government data per citizen request. MP/API/methodology reads are dynamic over locally stored snapshots, so updates do not require rebuilding. A read-only/serverless deployment needs an external ingestion job and persistent artifact distribution; ephemeral function storage is insufficient.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:civic
npm run start -- --hostname 127.0.0.1
# In another terminal, with the local server running:
npm run test:layout
```

The layout check uses installed Microsoft Edge through Playwright. It checks 15 routes/views (including both MP aliases, a ministry filter and all nine record collections) at 320, 375, 430, 768, 1024, 1280 and 1440 pixels with all record disclosures open, and saves screenshots plus `docs/layout-check.json`. Install Edge or adapt the explicit browser channel on other platforms. Unit tests use captured official fixtures and cover malformed data, identity, duplicates, dates, money, attendance compatibility, provenance and pending states.

## Known limitations

- Snapshot data is refreshed by ingestion, not continuously live. The UI marks snapshots older than 30 days.
- Attendance session 7 has mismatched dates; session 8 questions have no corresponding calendar in the captured calendar response. No aggregate attendance is published.
- Private bill records document introduction, not subsequent passage or current legislative status. Committee open-ended terms are not independently confirmed current memberships.
- MPLADS reporting cut-off, amount released, balance and utilization are unavailable. Twenty works have conflicting stages. Work-level coordinates, PIN mappings and completion dates are not supplied by these reports.
- Original affidavit figures, portrait permission and exact constituency/PIN source references need further document verification. The biography education text differs in detail from the affidavit seed; neither was silently substituted for the other.
- Citizen submissions are a local single-disk pilot. Before publicly opening submissions, configure managed operator authentication, private persistent storage, backups, malware scanning, retention/deletion, abuse controls, monitoring and a public correction/removal contact. See the production requirements in `docs/CITIZEN-CONTRIBUTIONS.md`.
- The public domain could not be resolved during the 24 September 2026 DNS/HTTPS check. Confirm DNS and TLS after deployment; this repository cannot configure either.
- This supplied directory has no Git repository. No commits were created.


