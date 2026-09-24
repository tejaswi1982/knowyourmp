# Citizen contributions · local pilot

## Run
Requires **Node 24.14+** for the built-in `node:sqlite` implementation, a persistent writable disk and one application deployment on that disk. Run `npm ci`, set `CIVIC_ADMIN_TOKEN` to a random secret of at least 32 characters in `.env.local`, then `npm run dev`. No secret is supplied in the repository. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Open `/admin/contributions` and enter the token. Keep this local prototype bound to loopback until production requirements below are met.

Optional `CIVIC_STORAGE_DIR` selects an absolute persistent storage path. Default: `data/participation/`, ignored by Git and entirely separate from government `data/raw` and `data/normalized`. `lib/contributions/schema.sql` is the idempotent version 1 migration. SQLite uses WAL, transactions, a busy timeout and unique submission tokens. Back up the database, WAL state and uploads consistently; stop the application or use a SQLite-aware backup.

If deployed behind a reverse proxy, set `CIVIC_PUBLIC_ORIGIN` to the exact external HTTPS origin (no trailing slash). Locally, same-origin validation compares the browser Origin to the HTTP Host; untrusted forwarded-host headers are not used.

## Observation workflow
400053 → Mumbai North-West MP → public money → `/works` → permanent work URL → `/verify`. Five steps confirm the official project and self-reported proximity, choose one of nine neutral visible states, attach 1 to 3 photos, enter an optional factual note/date, and review/acknowledge personal observation. Submissions return a receipt, enter pending/private and receive an HttpOnly SameSite session cookie. No account or email is required. The quiet browser contribution summary includes pending submissions. Cookie removal loses that summary; it is not a verified identity or recovery credential.

## Moderation and publication
Admin access uses a server environment token compared by constant-time digest comparison. The browser holds it only in memory, never localStorage. Admin APIs and private attachments require Bearer authentication; write APIs require same-origin requests. Do not distribute the token to citizens. HTTPS is mandatory if remotely accessed.

The queue shows work links, original wording, observation/document date, upload timestamp, original filename, images, source links and self-reported coarse proximity. Review relevance, privacy and factual wording; for a supporting document, check its origin and relevance. Publish makes that evidence and its safe attachments visible. Reject/Needs review hides it again, including direct attachment URLs. Each transition is recorded atomically in moderation_events. No silent wording edits, canonical-truth promotion or official snapshot writes occur. Publication of a citizen observation is not independent verification. Keep the receipt for operator-assisted correction/removal; no self-service deletion or public contact channel is implemented yet.

## Privacy and media
No GPS/EXIF geolocation, IP, email, device identity or exact contributor location is collected. Only yes/no/unsure proximity is retained as text. Photographs are decoded with Sharp, restricted to JPEG/PNG/WebP and 40 megapixels, reoriented, resized to at most 1800px and re-encoded to JPEG without EXIF/XMP. Original image bytes are discarded. Original filenames are retained privately for moderation; generated UUID filenames are used on disk. Uploaded photographs remain private until the parent contribution is published. Citizen names are never shown. Review visual identifying content: stripping metadata does not anonymize faces or signs.

Supporting documents accept public HTTPS URLs, PDF or image uploads, a field and explanation. URLs are never fetched by the server. Reject credentials, non-HTTPS schemes, IP literals and obvious local hostnames; external destinations still require human inspection. PDF signature/end markers are checked, but this is not malware scanning or full structural sanitization. PDFs are always downloaded as attachments with nosniff and a sandbox CSP. PDF metadata is not stripped; only already-public, non-personal documents should be accepted, and moderators must inspect them. Production requires malware scanning and sanitized document previews.

All uploads enforce extension/MIME agreement, size (5 MB/file), count (3), total body (16 MB) and decoder checks. The storage adapter in `media.ts` is the replacement point for private object storage. Uploads never sit under `public/`. Public API projections omit session identity, original filenames, internal moderation data and private storage paths. Notes use plain text; HTML is rejected, and React escapes rendered strings.

## Abuse controls
SQLite-backed hourly caps apply globally (60 attempts) and per session (8). They survive restarts, but fresh anonymous sessions can evade the session cap and exhaust the global cap. This is a bounded local demonstration, not production anti-abuse. Add gateway body/time limits, durable client-level throttling, bot challenges, monitoring, appropriate identity/receipt recovery and operator access control before opening submissions publicly. Same-origin enforcement is CSRF protection, not identity authentication.

## Follow area
Follow 400053 stores only a localStorage preference on this device. No notification subscription is created. Future channels may include opt-in email or push; WhatsApp would require a later legal/technical assessment and explicit consent. There are no messaging integrations.

## Production requirements
The inherited Next.js 14.2.15 and Sharp stack was upgraded to Next.js 15.5.26 and Sharp 0.35.4 on 24 September 2026. Run `npm audit` against the current advisory database before each release. Add managed operator authentication, revocation and audit identities; private object storage with authenticated delivery; lifecycle/deletion and retention policies; malware scanning; an accessible correction/removal contact; production abuse controls; backups and operational monitoring before publicly opening submissions. This SQLite/local-disk implementation is unsuitable for ephemeral serverless instances or multiple independent disks. Future object storage must keep moderation gates and strip image metadata before exposing derivatives.

## APIs
GET `/api/works`, GET `/api/works/[id]` (officialRecord envelope), GET/POST `/api/works/[id]/observations`, POST `/api/works/[id]/documents`, GET `/api/contributions/me`, GET `/api/contributions/media/[id]`, and authenticated GET/POST `/api/admin/contributions`. Supporting documents currently render on the server work page. There is no API for modifying official data or submitting authority responses.

## Sprint verification · 21 September 2026

- `npm run lint`: passed; no warnings or errors.
- `npm run typecheck`: passed.
- `npm test`: 24 tests passed, including the existing ingestion suite and new contribution/security/privacy tests.
- `npm run build`: production build passed. Node emits its built-in SQLite experimental warning.
- `node scripts/check-civic-loop.mjs` (also `npm run test:civic`): passed against the production build using headless Edge, a randomly selected loopback port and an isolated temporary SQLite/upload store. Exercises 400053 → MP → public money → works → work 244718 → observation with photo → private pending → moderator publication → public citizen check → official source dialog. Also submits and publishes a supporting source, checks unknown-work 404 and checks five routes at four viewport widths (20 checks), with no overflow or browser page errors.
- Mobile index and work screenshots were visually reviewed. Test screenshots contain explicitly labelled synthetic test evidence, never real citizen evidence; the application store and government snapshots are untouched by browser fixtures. Results: `docs/civic-loop-check.json` and `docs/screenshots/civic-*.png`.

The browser journey is automated UI validation with visual review, not an on-ground citizen field trial. The initial browser run uncovered and resolved an internal-hostname origin mismatch; a unit regression covers it.

## Final pre-launch check · 24 September 2026

Next.js was updated to 15.5.26, Sharp to 0.35.4, and PostCSS to a patched version. Final tests: lint, typecheck, 24 unit tests, dependency audit (zero known vulnerabilities), production build, the civic journey against an isolated store, 105 route/viewport checks, and nine homepage viewport checks. The offline review exports in `exports/` were regenerated. Production security and operations requirements above remain before publicly opening citizen submissions.
