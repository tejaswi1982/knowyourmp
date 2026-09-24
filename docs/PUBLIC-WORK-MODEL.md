# Public work model

## Official record
The existing `ProjectRecord` remains unchanged. `lib/works.ts` reads published pilot works through the repository and maps `mplads:244718` to `/works/244718`. Numeric IDs are validated and unknown IDs return 404. All 67 available records remain constituency-wide; none are asserted to belong to PIN 400053.

The title and description, recommended/sanctioned/spent amounts, implementing agency and district authority, recommendation/sanction/completion dates, verbatim official status, conflict note, category, reporting scope and provenance remain official fields. Unavailable values remain unavailable. Both report statuses remain visible. The source register retains original POST request details and hashes. The work page provides source links and reporting caveats.

## Citizen evidence
`Contribution` is stored in a separate SQLite database. Fields: ID, workId (numeric URL identity), kind, sourceType=citizen, observationType, note, observationDate, submittedAt, approximateLocation (self-reported proximity answer), photoIds, private sessionId, anonymousPublicly, moderationStatus, visibilityStatus, verificationState, createdAt and updatedAt. Optional document fields: field and sourceUrl. No precise location, distance, email or account data is collected. File metadata is in a separate private media table.

Public projections explicitly select permitted fields. Only published/public rows and their attachments are accessible without admin credentials. Observation verificationState remains `unverified` even after publication. It is never mapped to an official work status or score.

## Verified supporting documents
Documents use the same contribution envelope with kind=document. A moderator must explicitly check the source before publication (`source_checked`). This describes source review, not government certification. No official field is mutated. Notes remain immutable; no edited summary is currently supported. Corrections requiring changed wording need a new submission and withdrawal of the prior one.

## Authority / representative responses
Separate `authority_responses` table and `AuthorityResponse` contract: id, workId, respondingOrganisation, responseText, responseDate, supportingDocumentUrl, verificationState and visibilityStatus. The work page renders a distinct section only for public, identity-verified entries. No submission portal or insertion API ships yet. A future controlled service must validate respondent identity, plain text, source URLs, permission to publish and audit history before writing records. Never treat a response as a replacement for another evidence layer.

## History
The work page combines genuine recommendation/sanction/completion dates (when supplied) with submission dates for published citizen evidence. It labels each event's origin and does not invent project events. Private moderation transitions remain in a separate audit table. A future public correction timeline can extend this without conflating observation, submission, publication and official dates.
