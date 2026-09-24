import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('displayed photographs retain the original bytes, attribution and license evidence', async () => {
  for (const id of ['andheri-west', 'lok-sabha', 'andheri-sports', 'andheri-flyover']) {
    const manifest = JSON.parse(await readFile(`data/photography/${id}.json`, 'utf8'));
    const bytes = await readFile(manifest.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.sha256);
    assert.equal(bytes.length, manifest.bytes);
    assert.equal(new URL(manifest.page).hostname, 'commons.wikimedia.org');
    assert.ok(manifest.creator && manifest.license && manifest.changes);
    assert.ok(Number.isFinite(Date.parse(manifest.retrievedAt)));
    assert.ok(manifest.licenseUrl.startsWith('https://'));
    const evidence = await readFile(`data/photography/${id}.source.html`, 'utf8');
    assert.match(evidence, /creativecommons.org|GODL-India/);
  }
});
