# Civic journey review

Scope: existing PIN 400053 → Ravindra Dattaram Waikar / Mumbai North-West. Review performed on the rendered local application, with a separate review database and a photograph explicitly marked **REVIEW FIXTURE  -  Not a photograph of this public work**. No test content is stored in the real civic record.

## Working

The initial manual browser trace accepted 400053 and opened the correct MP story. Opening the public-money disclosure exposed a working `/works` link and 67 real works. Work 244718 opened; its official values and both conflicting statuses were readable. The official source dialog showed Works recommended and Works sanctioned, retrieval date, reporting caveat and dashboard instructions.

The initial manual trace completed all five verification steps: project/proximity, neutral observation, file chooser and photo preview, note/date, and review/acknowledgement. Submission returned receipt `8ca95af8-b55b-4d3e-8070-2ec145aa50d9` in the isolated review store. The admin queue displayed it. Needs review, Reject and Publish were each exercised. Returning through the work link showed a published observation under Citizen checks, outside Official record. The test note explicitly says it does not describe the real work.

## Broken

- The old standalone `exports/KnowYourMP-review.html` did not export `/works`, work detail, verification states, confirmation or admin. Its navigation router had no `/works` mapping. A reviewer could not trace the participation loop through that artifact even though routes existed in the app.
- Fast first interaction during hydration could lose input on both the admin login and homepage PIN field, producing misleading validation errors. Retrying after hydration worked. Both entry controls are now disabled until client interaction is ready.

## Hidden / not discoverable

- The MP's only participation link was inside the closed “where did it go?” disclosure, after sanction/expenditure details. The default public-money section showed a total without a direct work-exploration action.
- Work detail's only Verify CTA was below the full official record, requiring a long mobile scroll.
- Verification exposed only the current step number and heading. The five-stage route was not visible together.

## Confusing

- Index items were large plain linked paragraphs; the open-project affordance was subdued and the official status lacked a label.
- The photo-only step mentioned PDF privacy restrictions despite not accepting PDFs.
- Confirmation described review in a paragraph but did not explicitly enumerate “not public yet”, approval and unchanged official data.
- Work browser tabs used the generic site title. A single observation was labelled “1 published observations”.
- Location is embedded in official descriptions, not structured/geocoded. A locality dropdown would imply data the snapshot does not contain; literal locality/work search remains the honest option.

## Fixed

- Default MP public-money section now shows the real work count and **Explore public works →**, outside any disclosure.
- Index actions say **Open project & citizen checks →**, with underline and hover/focus feedback; statuses are explicitly official and the search is labelled Locality / work search.
- Work header now has a visible Verify action and links to Official record, Citizen checks and Sources. The invitation below the record uses “Can you verify this work?” and neutral explanatory copy.
- All five stage labels are visible on every form step with the current stage marked. Existing neutral options and file handling remain unchanged.
- Confirmation explicitly states pending moderation, not public yet, approval before display and unchanged official data. **Return to project →** provides the next action. Focus moves to confirmation.
- Photo-only guidance no longer mentions PDFs. Admin login waits for hydration; work metadata and singular observation wording are corrected.
- A new standalone rendered-state review artifact includes the entire journey with Home, MP Story, Works, Demo Work, Verify and Admin navigation. It is clearly labelled a visual review, not a live submission form.

### Exact demo work

| Field | Existing source value |
| --- | --- |
| Work ID / route | `244718` / `/works/244718` |
| Official title | WS/MP18308/2025-2026/244718-Providing drains and gutters for public drainage |
| Official description | Providing Ladi at Saraswati society Nagari nivara plot number 6 Goregaon East Mumbai |
| Locality in description | Saraswati society, Nagari nivara plot number 6, Goregaon East, Mumbai. No structured/geocoded locality exists. |
| Recommended / sanctioned | ₹15,00,000 / ₹15,00,000 |
| Expenditure / implementing agency | Not supplied / not supplied |
| Status | Recommendations report: Pending for Sanction; sanctions report: Sanction |
| Dates | Recommended 31 October 2025; sanctioned 25 March 2026 |
| Source | MoSPI MPLADS dashboard, Works Recommended and Works Sanctioned, retrieved 19 September 2026 |
| Source link | https://mplads.mospi.gov.in/digigov/dashboard.html |

This is the existing mission work, chosen to preserve continuity. Its description identifies a named society and plot, both amounts are supplied, and its conflict usefully demonstrates source separation. The official title and description are both retained rather than silently reconciled.

### Final manual trace and mobile review

The revised journey was manually completed at **375 px** and repeated at **430 px on the final production build**. The final production submission receipt is `14ce0de7-01e7-45bd-a35e-3c707397acdf`, in the isolated review store only. Its note reads “430 px production review fixture only. Not evidence about the real work.” It was found in the admin queue, published through the UI, and then found under Citizen checks. The source dialog was reopened after publication. Recommended and sanctioned amounts remained ₹15,00,000, the completion date remained unavailable, and both original conflicting official statuses remained intact.

| Step | Final rendered result |
| --- | --- |
| 1. Enter 400053 | Accepted; input now waits for hydration |
| 2. Correct representative | Ravindra Dattaram Waikar / Mumbai North-West |
| 3. Public money visible | Existing story money section retained |
| 4. Clear works CTA | 67 public works / Explore public works, outside disclosure |
| 5. CTA destination | `/works` |
| 6. Understandable index | Count, constituency scope, search and real filters |
| 7. Open-project affordance | Underlined action and whole linked item |
| 8. Detail route | `/works/244718` opens |
| 9. Official record readable | Original title, description, values, missing fields and statuses retained |
| 10. Source accessible | Official source dialog and source register links |
| 11. Verify visible | Header action plus invitation beneath official record |
| 12. Form opens | `/works/244718/verify` |
| 13. Five stages visible | Project, Observation, Photo, Note, Review on every step |
| 14. Photo upload visible | Device and camera controls; fixture selected through file chooser |
| 15. Observation options visible | All nine existing neutral options |
| 16. Note visible | Optional factual note and date |
| 17. Review visible | Project, state, photo, date, note and acknowledgement |
| 18. Submit succeeds | Receipt returned |
| 19. Moderation explained | Explicit not-public-yet, approval and unchanged official data |
| 20. Queue entry appears | Exact submitted note/photo/receipt found |
| 21. Moderator publishes | Publish exercised; Reject and Needs review also verified |
| 22. Public evidence appears | Published test observation rendered under Citizen checks |
| 23. Layers remain distinct | Official record unchanged; citizen evidence separately labelled |

The mobile stage label initially split “Observation” awkwardly at 375 px; intrinsic-width columns fixed it. Both requested widths were visually inspected and used for interaction. These are browser viewport tests, not a physical-phone camera or on-ground field trial.

### Revised review artifact

`exports/KnowYourMP-civic-loop-review.html` contains **22 captured rendered states × 2 widths**, with Home, MP Story, Public money, Works, Demo Work, Verify, Admin and Citizen checks navigation, plus Previous/Next controls. The file embeds its screenshots and works offline. The screenshots themselves are intentionally not interactive, and the file prominently explains that it cannot submit or publish evidence. Real forms and moderation were used to create the captured states in an isolated temporary store. No credentials enter the artifact. Supporting documents are demonstrated with a clearly labelled fixture; no authority response is fabricated.

`exports/civic-review-manifest.json` records the final export and successful offline navigation check. The in-app browser's URL security policy rejected a direct `file://` preview; no bypass was attempted. File generation and offline navigation had already been verified by the export script before that preview attempt.

### Final checks

- `npm run lint`: passed, no warnings/errors.
- `npm run typecheck`: passed.
- `npm test`: 24 passed.
- `npm run build`: passed.
- `node scripts/check-civic-loop.mjs`: passed both civic loops and **30 responsive route checks**, including 375 and 430 px. The test explicitly verifies that the primary works CTA is reachable while the money disclosure remains closed.
- `node scripts/export-civic-review.mjs`: 22 rendered states at both widths; offline image decoding and every review navigation target passed.
- Manual rerun after the final build: 400053 → MP → visible works CTA → work 244718 → all five steps/photo → pending confirmation → admin → publish → separately labelled public evidence → official source.

### One remaining UX issue

Finding a specific project still depends on searching the source's prose location. The current official data has no verified structured locality or coordinates, so this pass does not invent a locality dropdown or distance filter.
