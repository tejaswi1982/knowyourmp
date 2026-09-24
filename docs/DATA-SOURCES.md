# Data sources  -  observed 2026-09-20

These are observed official website requests, not promised public API contracts. Run adapters off the citizen request path. Suggested refresh is weekly; neither publisher supplied a contractual update frequency. Raw bytes, request parameters, retrieval timestamps, parser version and SHA-256 hashes are retained in `data/raw/`; normalized snapshots reference those manifests. The UI exposes the evidence through its source register.

The current member identity was rechecked against the official [Digital Sansad biography for member 5701](https://sansad.in/ls/members/biography/5701?from=members) on 24 September 2026. The public page lists Ravindra Dattaram Waikar, Shiv Sena, Mumbai North-West, Maharashtra, and records election to the 18th Lok Sabha in June 2024. The source registry links directly to that page with this retrieval date. This identity cross-check did not replace any inherited affidavit values or parliamentary/MPLADS snapshots.

## Digital Sansad

Member ID **5701**, Lok Sabha **18**. Discovery started at https://sansad.in/ls/members and the linked biography https://sansad.in/ls/members/biographyM/5701?from=members. The site's linked biography bundle `%5Bmpcode%5D-da7431a4d0736b89.js`, API-config chunk `4162-eb39a9a222a66d2c.js` and chunk `9794-ed6a2d350b57c1e8.js` exposed the requests below. URLs were then requested directly and checked against the member and records. Diagnostic downloads remain in ignored `data/research`; production evidence is retained under `data/raw/sansad`.

All requests are GET, base `https://sansad.in`; no API key or login. Parser version `sansad-1.0.0` (see client constant for canonical spelling).

| Dataset | Path and parameters | Observed response |
| --- | --- | --- |
| Biography | `/api_ls/member/5701?locale=en` | Object: `mpsno`, `firstLastName`, `partyFname`, `constituency`, education and biography fields |
| Index cross-check | `/api_ls/member?loksabha=18&sitting=1&locale=en&searchText=Waikar` | Matching member entry; research cross-check, not a production count |
| Questions | `/api_ls/question/qetAllQuestionsForMember?lkNo=18&mpNo=5701&pageNo=1&pageSize=10&locale=en` | One-element array containing `listOfQuestions`, `totalRecordSize`, `_metadata` |
| Debates | `/api_ls/debate/debate-search?debateTypeId=&loksabha=18&sessionNumber=&fromDate=&toDate=&searchKeyword=&page=1&size=10&mpCode=5701&sortBy&sortOrder&house=LS` | Object with `_metadata.totalElements` and `records` |
| Private bills | Same debate request with `debateTypeId=39` | Private member bill participation; parser accepts explicit introductions by this member only |
| Committees | `/api_ls/committee/findCommitteeMembership?mpsno=5701&lsno=18` | `metaDataDto`, `committeeMembershipDtoList` |
| Session calendar | `/api_ls/member/members-loksabha-session?mpCode=5701` | Array of Lok Sabha terms, each containing sessions and date lists |
| Attendance | `/api_ls/member/getMemberAttendanceByMpsno?loksabha=18&session=7&mpsno=5701` | Array of dated attendance-code entries; requested for each returned session |

Pagination uses the website's page size 10. Every page's total must stay consistent; the fetched record count must equal the declared total. Duplicate normalized IDs, malformed dates, member mismatches and large unexplained record-count drops block publication. Question identity combines House, session, type, number and date because question numbers repeat between sessions.

### Snapshot results and interpretation

- **243 questions**, 25 pages. Fields include `quesNo`, `subjects`, `lokNo`, member list, `ministry`, `type`, date, `questionsFilePath`, `sessionNo`. Inline question/answer text is null in these responses. Exact official PDF URLs provide the question and answer reference; this pass does not extract PDF text.
- **51 debate/participation records**, six pages. `dbSlno`, `debateTitle`, date, `typeDesc` and `mpPartDetailList` identify the member's participation. The observed website link pattern is `/ls/debates/view-debate?ls=18&session=...&dbslno=...`. This is a count of participation records, not speeches inferred from mentions in transcripts.
- **3 private bill introductions**, dated 2025-12-05. Current subsequent legislative status is unknown. Government bill participation (type 14) is excluded.
- **3 committee terms**, including two Housing and Urban Affairs terms and one Income Tax select-committee term. An absent end date is shown as absent, not proof of current membership.
- **7 session attendance records**. Official signed/explicit attendance codes `S`, `S*`, `S#`, `NS@` count as attended; `NS` is not signed, not inferred absence, and `NR` is no requirement. Numerators and denominators are published only where date sets reconcile. Session 7 has 30 calendar dates but 31 signed entries: two calendar dates are missing and three attendance dates (16 to 18 April 2026) fall outside the calendar. Its fraction is withheld. Questions include session 8 but the calendar does not. No aggregate or lifetime percentage is calculated.

Biography identity agrees with the seed except hyphenation (`Mumbai North West` versus `Mumbai North-West`). Its education description is B.Sc., Mumbai University; the seed has affidavit-derived education/college details. These are flagged as different source descriptions, not evidence to overwrite the affidavit. Existing assets, liabilities and declared cases remain unchanged.

Fallback: retain last successful snapshot, display failed/stale/partial state and link the official biography/records. If these contracts change, review the official site or documents and update the parser; do not guess an alternative URL or silently return zero.

## MPLADS

The legacy `https://www.mplads.gov.in` timed out during direct investigation. No values were taken from unavailable legacy reports. Sansad's older `/api_poi/cons-connect/mplad/mp-fund?mpCode=5701&house=L` returned an empty array, which is not interpreted as zero expenditure.

The official Sansad configuration `https://sansad.in/cms/ls-pp/api/mplad` supplied `attributes.siteUrl` pointing to **https://mplads.mospi.gov.in/digigov/dashboard.html**. Linked dashboard scripts (`preLoginDashboard`, `loksaba`, `poptable`, `graph`) exposed the current JSON report flow. It requires public POST requests, not cookies, credentials, generated WebForms tokens or browser automation.

Base: `https://mplads.mospi.gov.in/rest/PreLoginDashboardData/`. All requests below are **POST**, `Content-Type: application/json`. Parser version is recorded by `lib/ingestion/mplads/client.ts` and every manifest.

| Endpoint | Exact JSON body | Selection / response |
| --- | --- | --- |
| `getStateData` | `{}` | Maharashtra `STATE_ID=21` |
| `getTenureData` | `{"uname":"0,0,0,2"}` | 18th Lok Sabha tenure ID `7` |
| `getConstituencyData` | `{"id":"21"}` | Mumbai North West ID `270` |
| `getMpAndConstCombo` | `{"const_combo":"270,2,7"}` | Member ID `3042793`, Ravindra Dattaram Waikar |
| `getTilesData` | `{"uname":"21,270,3042793,2,7"}` | Labeled financial/count tiles, selected tenure |
| `getTilesReportData` | `{"combo":"21,270,3042793,2,7","key":"Works Recommended"}` | `Total Works Recommended`: JSON-encoded row list, trailing total |
| `getTilesReportData` | `{"combo":"21,270,3042793,2,7","key":"Works Sanctioned"}` | `Total Sanction Work`: JSON-encoded row list, trailing total |
| `getTilesReportData` | `{"combo":"21,270,3042793,2,7","key":"Expenditure on Completed and On-going Works as on Date"}` | `Total Expenditure`: JSON-encoded transaction list, trailing total |

The selector chain is re-verified each ingestion. Reports are scoped to House 2, constituency 270, member 3042793 and the 18th Lok Sabha. UI links open the official dashboard with instructions for these selectors. Raw POST endpoint requests are inspectable in the source register; GET hyperlinks cannot reproduce POST reports.

### Snapshot results and interpretation

- Allocated limit **₹14,70,00,000**. This is not annual entitlement or amount released.
- **67 recommended works**, total **₹14,70,00,000**.
- **46 sanctioned works**, total **₹9,80,00,000**.
- **24 expenditure transaction rows**, total **₹5,37,99,122**, joined to works by official work ID. These rows are not counted as 24 distinct works.
- The published normalized collection contains **67 unique works**. Recommended and sanctioned report totals reconcile to their exact row sums; expenditure reconciles to transaction sums. The portal's compact tile labels may be rounded; report amounts supply exact financial values.
- Annual ₹5 crore entitlement is the inherited scheme value, kept separate from tenure allocation. Amount released, balance and utilization have no verified fields here and stay unavailable.
- The source calls expenditure “as on Date” but supplies no reporting cut-off. Retrieval date is not relabeled as a reporting date.

Rows expose `WORK_RECOMMENDATION_DTL_ID`, `ACTIVITY_NAME`, `WORK_DESCRIPTION`, recommendation/sanction dates, stage, amounts and district authority. Expenditure rows supply `IA_NAME` and `FUND_DISBURSED_AMT`. Official titles and descriptions are preserved, including work numbers and source spelling. `IDA_NAME` is labeled district authority, not conflated with implementing agency. `NA` dates stay missing. Currency parsing accepts the replacement currency glyph actually received while preserving exact raw bytes and requiring safe, nonnegative paise precision.

**20 works have conflicting stages** between recommendation and sanction reports. Both source stage values are displayed; the parser does not pick a favorable status. No coordinates, verified PIN mapping or completion dates are provided by these reports. No nearby-work claims or fake work examples are generated. Missing work-level expenditure is not zero.

Fallback: retain last good source snapshot and show source-unavailable status. If unavailable on first ingestion, keep honest integration/unavailable states. Do not backfill from demo data. HTML/PDF fallback has not been implemented because this observed official structured flow currently works.

## Other inherited sources

`data/sources.ts`, `data/mps/ravindra-waikar.ts`, `data/constituencies.ts` and `lib/lookup.ts` retain the original source mapping. Affidavit education/assets/liabilities/declared-case values are static, not refreshed by these adapters. Several citations still point to portal roots rather than the exact candidate document. Exact affidavit and delimitation-document verification remains outstanding. Portrait reuse permission has not been established; an unsupported blanket licensing statement was removed.

## Integrity and operation

Custom runtime validators are used with the existing TypeScript models; no parallel schema system was introduced. Raw responses are saved before parsing. Tests include captured official payloads and a fixture provenance index. Financial sums, uniqueness, dates, identities and scope must validate before atomic publication. A failed source run does not replace its last-good snapshot or the other source's data. Snapshot checksums are checked on read. No scheduler is installed; configure weekly serialized ingestion with persistent storage and failure monitoring as documented in README.

Hashes prove which bytes were parsed, not whether the originating institution's claims are correct. Known source conflicts remain visible. An external outage does not prevent the app from serving its local record.

