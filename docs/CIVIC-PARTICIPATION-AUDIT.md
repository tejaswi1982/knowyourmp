# Civic participation audit

Audit of the existing checksummed MPLADS snapshot, retrieved 19 September 2026. Scope: Ravindra Dattaram Waikar, Mumbai North-West; entry PIN 400053. The 67 works span the constituency, not a verified PIN boundary.

## Existing work model

`ProjectRecord` in `types/civic.ts`, loaded through `lib/repository.ts`. Normalized IDs are `mplads:<official numeric ID>`; public URLs use the numeric suffix. Recommendation, sanction and expenditure reports are joined by official work ID. No new ingestion or geographic expansion is required.

## Fields available

| Field | Works with value |
| --- | ---: |
| ID, official title, description | 67 |
| Recommended amount and date | 67 |
| Sanctioned amount and date | 46 |
| Work expenditure | 24 |
| Verbatim official status | 67 |
| Status conflict note | 20 |
| Normalized status | 47 |
| Implementing agency | 24 |
| District authority | 67 |
| Official category | 67 |
| Reporting-period caveat, source URL, source references and manifests | 67 |

## Fields missing

No structured locality/locationText, coordinates, work PIN, completion date, contractor or work-order attachment. Missing amounts and agencies remain unavailable, never zero or inferred. Description is distinct from title and often contains a location in prose.

## Geographic quality

Descriptions contain location phrases, but these are not verified coordinates or structured localities. Search may match literal description/title text. No locality taxonomy, proximity ordering, distance or Near me filter is safe. Do not label all 67 works as located in Andheri West.

## Status quality

Twenty works retain both `Recommendations report: Pending for Sanction` and `sanctions report: Sanction`. Other verbatim values: Vendor Identification, Work partially Completed, Time Estimation, Pending for Sanction. No choice of a preferred report is justified. Citizen appearance states must be independent of these labels.

## Source integrity

All works have source references, a dashboard URL and raw request manifests including retrieval time, POST body, endpoint, parser version and content hash. Dashboard links require selecting Maharashtra, Mumbai North West, Ravindra Dattaram Waikar and 18th Lok Sabha. They are not work-specific deep links. Reporting period is 18th Lok Sabha, as retrieved; no reporting cut-off is supplied. Existing snapshot checksum validation remains the repository boundary.

## What can safely power citizen verification

Permanent work identity, verbatim descriptions, independently labelled amounts/dates/statuses, actual source references and photographs submitted later. Official categories are exactly `Normal/Others` and `Repair and Renovation`; filter only by these original labels, without classification or confidence inference. Citizens can document visible conditions or submit a source for missing information. Neither changes official fields. Publication denotes moderation, not independently verified truth.
