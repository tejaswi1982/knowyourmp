export const observationTypes = [
  'Work not visible / not found', 'Work appears not started', 'Work appears ongoing',
  'Work appears complete', 'Facility appears inaccessible', 'Facility appears damaged',
  'Location appears incorrect', 'Information board / project signage not visible', 'Other observable issue',
] as const;
export const documentFields = ['Location', 'Completion date', 'Expenditure', 'Contractor', 'Work order', 'Project document'] as const;
export type ModerationStatus = 'pending' | 'published' | 'rejected' | 'needs_review';
export interface Contribution {
  id: string; workId: string; kind: 'observation' | 'document'; sourceType: 'citizen';
  observationType?: string; note: string; observationDate: string; submittedAt: string;
  approximateLocation?: string; field?: string; sourceUrl?: string; photoIds: string[];
  sessionId: string; anonymousPublicly: true; moderationStatus: ModerationStatus;
  visibilityStatus: 'private' | 'public'; verificationState: 'unverified' | 'source_checked';
  createdAt: string; updatedAt: string;
}
export interface AuthorityResponse {
  id: string; workId: string; respondingOrganisation: string; responseText: string;
  responseDate: string; supportingDocumentUrl?: string;
  verificationState: 'pending' | 'identity_verified'; visibilityStatus: 'private' | 'public';
}
export function publicContribution(c: Contribution) {
  return { id: c.id, workId: c.workId, kind: c.kind, sourceType: c.sourceType,
    observationType: c.observationType, note: c.note, observationDate: c.observationDate,
    submittedAt: c.submittedAt, approximateLocation: c.approximateLocation,
    field: c.field, sourceUrl: c.sourceUrl, photoIds: c.photoIds,
    contributorLabel: 'Citizen · anonymous publicly', verificationState: c.verificationState };
}
export function factualText(value: unknown, max = 600) {
  if (typeof value !== 'string' || value.length > max || /[<>\u0000-\u0008]/.test(value)) throw new Error('Use plain factual text without HTML, up to ' + max + ' characters.');
  return value.trim();
}
export function sourceUrl(value: string) {
  if (!value) return undefined;
  const url = new URL(value);
  if (value.length > 2000 || url.protocol !== 'https:' || url.username || url.password || url.port ||
      !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(url.hostname) ||
      /(?:^|\.)(localhost|local|internal|test|example|invalid|onion)$/.test(url.hostname)) throw new Error('Use a public HTTPS source URL without credentials.');
  return url.href;
}
export function validateSubmission(form: FormData, kind: Contribution['kind']) {
  const note = factualText(form.get('note') ?? '');
  const date = String(form.get('observationDate') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date > new Date().toISOString().slice(0,10)) throw new Error('Choose a valid observation/document date, no later than today.');
  if (form.get('acknowledged') !== 'true') throw new Error('Confirm that you personally observed or documented this evidence.');
  const files = form.getAll('files').filter((f): f is File => typeof f !== 'string' && f.size > 0);
  if (files.length > 3 || files.some(f => f.size > 5 * 1024 * 1024)) throw new Error('Upload up to 3 files, at most 5 MB each.');
  if (kind === 'observation') {
    const observationType = String(form.get('observationType'));
    if (!(observationTypes as readonly string[]).includes(observationType)) throw new Error('Choose an observation from the list.');
    const near = String(form.get('near'));
    if (!['yes', 'no', 'unsure'].includes(near)) throw new Error('Tell us whether you are at or near the described location.');
    if (!files.length) throw new Error('Add at least one photograph documenting your observation.');
    return { note, observationDate: date, observationType, approximateLocation: near === 'yes' ? 'Contributor reports being at or near the described work' : near === 'no' ? 'Contributor reports being away from the work' : 'Proximity not confirmed', files };
  }
  const field = String(form.get('field'));
  if (!(documentFields as readonly string[]).includes(field)) throw new Error('Choose the field this evidence relates to.');
  const url = sourceUrl(String(form.get('sourceUrl') ?? ''));
  if (!url && !files.length) throw new Error('Add a source URL or a document.');
  if (!note) throw new Error('Explain what the source documents.');
  return { note, observationDate: date, field, sourceUrl: url, files };
}
