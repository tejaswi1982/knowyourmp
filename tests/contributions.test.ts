import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { NextRequest } from 'next/server';
import { getWork, listWorks } from '../lib/works';
import { contributions, moderate, published } from '../lib/contributions/store';
import { observationTypes, validateSubmission, sourceUrl } from '../lib/contributions/model';
import { sameOrigin, submit } from '../lib/contributions/http';
import { GET as mediaGET } from '../app/api/contributions/media/[id]/route';
import { GET as workGET } from '../app/api/works/[id]/route';
import { GET as adminGET, POST as adminPOST } from '../app/api/admin/contributions/route';
process.env.CIVIC_STORAGE_DIR = mkdtempSync(path.join(tmpdir(), 'civic-test-'));
process.env.CIVIC_ADMIN_TOKEN = 'test-only-admin-token-at-least-32-characters';
const base = 'http://localhost:3000';
async function form() {
  const f = new FormData();
  for (const [key, value] of Object.entries({ observationType: observationTypes[2], near: 'yes', note: 'Paving appears incomplete.', observationDate: '2026-09-20', acknowledged: 'true', requestId: randomUUID() })) f.set(key, value);
  const jpg = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#ddd' } }).jpeg().withMetadata({ exif: { IFD0: { Artist: 'private-name' } } }).toBuffer();
  f.append('files', new File([jpg], 'private-filename.jpg', { type: 'image/jpeg' }));
  return f;
}
function req(f: FormData) { return new NextRequest(base + '/api/works/244718/observations', { method: 'POST', headers: { origin: base }, body: f }); }

test('existing pilot work resolves, malformed and unknown IDs return 404', async () => {
  assert.equal((await listWorks()).length, 67);
  assert.equal((await getWork('244718'))?.id, 'mplads:244718');
  for (const id of ['999999999', '../244718', 'mplads:244718']) {
    assert.equal(await getWork(id), null);
    assert.equal((await workGET(new Request(base), { params: Promise.resolve({ id }) })).status, 404);
  }
});
test('valid observation moves through review without altering official data or leaking private fields', async () => {
  const before = readFileSync('data/normalized/mplads.json');
  const result = await submit(req(await form()), '244718', 'observation');
  assert.equal(result.status, 201);
  const { id } = await result.json();
  const c = contributions().find(c => c.id === id)!;
  assert.equal(c.moderationStatus, 'pending');
  assert.equal(published('244718').length, 0);
  assert.equal((await mediaGET(new Request(base), { params: Promise.resolve({ id: c.photoIds[0] }) })).status, 404);
  moderate(id, 'needs_review', false); assert.equal(published('244718').length, 0);
  moderate(id, 'published', true);
  const visible = published('244718'); assert.equal(visible.length, 1);
  const json = JSON.stringify(visible);
  for (const privateValue of [c.sessionId, 'sessionId', 'moderationStatus', 'visibilityStatus', 'original_filename', 'accountId', 'latitude', 'longitude', 'private-name', 'private-filename']) assert.ok(!json.includes(privateValue));
  const media = await mediaGET(new Request(base), { params: Promise.resolve({ id: c.photoIds[0] }) });
  assert.equal(media.status, 200);
  const metadata = await sharp(Buffer.from(await media.arrayBuffer())).metadata();
  assert.equal(metadata.exif, undefined); assert.equal(metadata.xmp, undefined);
  moderate(id, 'rejected', false); assert.equal(published('244718').length, 0);
  assert.equal((await mediaGET(new Request(base), { params: Promise.resolve({ id: c.photoIds[0] }) })).status, 404);
  assert.deepEqual(readFileSync('data/normalized/mplads.json'), before);
});
test('invalid observation, missing evidence, future dates and HTML are rejected', async () => {
  for (const [key, value] of [['observationType', 'fraud'], ['note', '<script>alert(1)</script>'], ['observationDate', '2099-12-31'], ['observationDate', '2026-02-30'], ['acknowledged', 'false']]) {
    const f = await form(); f.set(key, value); assert.throws(() => validateSubmission(f, 'observation'));
  }
  const f = await form(); f.delete('files'); assert.throws(() => validateSubmission(f, 'observation'));
  const plain = await form(); plain.set('note', 'The sign reads "A & B".'); assert.equal(validateSubmission(plain, 'observation').note, 'The sign reads "A & B".');
});
test('unsafe URLs and files cannot become evidence', async () => {
  for (const url of ['javascript:alert(1)', 'http://example.org', 'https://127.0.0.1/', 'https://user:pass@example.org', 'https://localhost', 'https://[::1]/']) assert.throws(() => sourceUrl(url));
  const f = await form(); f.delete('files'); f.append('files', new File(['<script>bad</script>'], '../../bad.jpg', { type: 'image/jpeg' }));
  assert.equal((await submit(req(f), '244718', 'observation')).status, 400);
  const html = await form(); html.delete('files'); html.append('files', new File(['bad'], 'bad.html', { type: 'text/html' }));
  assert.equal((await submit(req(html), '244718', 'observation')).status, 400);
});
test('supporting sources require explicit source check and stay separate', async () => {
  const f = await form(); f.delete('files'); f.set('field', 'Completion date'); f.set('sourceUrl', 'https://mplads.mospi.gov.in/digigov/dashboard.html');
  const result = await submit(req(f), '244718', 'document'); assert.equal(result.status, 201);
  const { id } = await result.json();
  assert.throws(() => moderate(id, 'published', false));
  moderate(id, 'published', true);
  assert.equal(published('244718').find(c => c.id === id)?.verificationState, 'source_checked');
  assert.equal((await getWork('244718'))?.completionDate, undefined);
});
test('admin and submission origin boundaries are enforced', async () => {
  assert.doesNotThrow(() => sameOrigin(new Request('http://localhost:3187', { headers: { origin: 'http://127.0.0.1:3187', host: '127.0.0.1:3187' } })));
  assert.throws(() => sameOrigin(new Request('http://localhost:3187', { headers: { origin: 'https://elsewhere.test', host: '127.0.0.1:3187' } })));
  assert.equal((await adminGET(new Request(base))).status, 401);
  const r = new Request(base, { method: 'POST', headers: { origin: 'https://elsewhere.test', authorization: `Bearer ${process.env.CIVIC_ADMIN_TOKEN}`, 'content-type': 'application/json' }, body: '{}' });
  assert.equal((await adminPOST(r)).status, 400);
  const f = await form();
  assert.equal((await submit(new NextRequest(base, { method: 'POST', body: f }), '244718', 'observation')).status, 400);
});
