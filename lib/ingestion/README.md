# Ingestion

Government requests run only in CLI adapters, never in frontend requests. Both adapters are connected to observed public official endpoints. See `docs/DATA-SOURCES.md` for the exact contracts and discovery evidence.

1. Re-verify official member/selector identity.
2. Fetch sequentially with timeout and retain raw bytes before parsing.
3. Validate schema, scope, dates, money, uniqueness and complete pagination/report totals.
4. Normalize into the existing `types/civic.ts` records, keeping exact official titles and source references.
5. Atomically publish a checksummed local snapshot; retain last-good data on failure.
6. Read through `lib/repository.ts`; derive parliamentary totals from validated rows.

CLI commands and deployment/update instructions are in the root README. Dry-run stores evidence but does not publish. No automatic scheduler is installed. Unknown fields stay unavailable; a complete verified empty dataset can be zero. Attendance and MPLADS conflicts are explicit partial states, not silently repaired.

Raw files and manifests are immutable. A hash links a normalized record to evidence; it does not certify the truth of the government's underlying record. Report requests are retained because the same URL with different POST parameters selects different members and tenures.
