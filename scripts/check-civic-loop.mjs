import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';

// Isolated evidence store: test images never enter the real civic record.
const store = await mkdtemp(path.join(tmpdir(), 'civic-browser-'));
const token = randomBytes(32).toString('hex');
const port = randomInt(32000, 42000);
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env: { ...process.env, CIVIC_STORAGE_DIR: store, CIVIC_ADMIN_TOKEN: token }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let logs = ''; server.stdout.on('data', b => { logs += b; }); server.stderr.on('data', b => { logs += b; });
let browser;
try {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try { const r = await fetch(base + '/api/works'); if (r.ok) break; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('response', async r => { if (r.request().method() === 'POST' && r.url().includes('/api/')) console.log('Submission/moderation response:', r.status(), await r.text()); });
  await page.goto(base); await page.locator('input[name=pin]').fill('400053'); await page.getByRole('button', { name: 'Find your MP' }).click(); await page.waitForURL(url => new URL(url).pathname === '/mp/mumbai-north-west');
  await page.getByRole('button', { name: 'Follow 400053', exact: true }).click();
  assert.equal(await page.locator('#money .money-reveal').getAttribute('open'), null);
  await page.getByRole('link', { name: 'Explore public works →' }).click();
  await page.waitForURL(url => new URL(url).pathname === '/works'); assert.match(await page.locator('h1').innerText(), /67/);
  await page.getByRole('link', { name: 'View work →', exact: true }).click();
  await page.waitForURL('**/works/244718');
  const workUrl = page.url(); assert.match(workUrl, /244718$/);
  await page.getByRole('link', { name: 'Verify this work →' }).click();
  await page.getByRole('radio', { name: 'Yes', exact: true }).check(); await page.getByRole('button', { name: 'Continue →' }).click();
  await page.getByRole('radio', { name: 'Work appears ongoing', exact: true }).check(); await page.getByRole('button', { name: 'Continue →' }).click();
  const jpg = await sharp({ create: { width: 700, height: 450, channels: 3, background: '#9da99f' } }).jpeg().toBuffer();
  await page.getByLabel('Upload from device').setInputFiles({ name: 'browser-test.jpg', mimeType: 'image/jpeg', buffer: jpg }); await page.getByRole('button', { name: 'Continue →' }).click();
  await page.getByLabel('Optional factual note').fill('Test fixture: paving appears incomplete.'); await page.getByRole('button', { name: 'Continue →' }).click();
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Submit for review' }).click(); await page.getByText('Evidence received · Pending moderation', { exact: true }).waitFor();
  const before = await (await context.request.get(base + '/api/works/244718/observations')).json(); assert.equal(before.observations.length, 0);
  await page.goto(base + '/admin/contributions'); await page.getByLabel('Admin token').fill(token); await page.getByRole('button', { name: 'Open moderation queue' }).click(); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Publish', exact: true }).click(); await page.getByText('observation · published · unverified').waitFor();
  await page.goto(workUrl); assert.equal(await page.getByRole('heading', { name: '1 published observation' }).count(), 1); assert.equal(await page.getByText('Test fixture: paving appears incomplete.', { exact: true }).count(), 1);
  await page.locator('.civic-evidence img').scrollIntoViewIfNeeded();
  await page.locator('.civic-evidence img').evaluate(img => img.decode());
  await page.getByRole('button', { name: 'Source for Official sources for work 244718' }).click(); await page.getByRole('dialog').waitFor(); await page.getByRole('button', { name: 'Close source' }).click();
  const after = await (await context.request.get(base + '/api/works/244718/observations')).json(); assert.equal(after.observations.length, 1); assert.ok(!JSON.stringify(after).includes('sessionId'));
  // Exercise the second loop with a URL-only supporting source.
  await page.getByRole('link', { name: 'Submit a document or source →' }).click(); await page.getByRole('button', { name: 'Continue →' }).click(); await page.getByRole('radio', { name: 'Completion date', exact: true }).check(); await page.getByRole('button', { name: 'Continue →' }).click(); await page.getByLabel('Public source URL (HTTPS)').fill('https://mplads.mospi.gov.in/digigov/dashboard.html'); await page.getByRole('button', { name: 'Continue →' }).click(); await page.getByLabel('Short explanation').fill('Test fixture: source offered for moderator review.'); await page.getByRole('button', { name: 'Continue →' }).click(); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Submit for review' }).click(); await page.getByText('Evidence received · Pending moderation', { exact: true }).waitFor();
  await page.goto(base + '/admin/contributions'); await page.getByLabel('Admin token').fill(token); await page.getByRole('button', { name: 'Open moderation queue' }).click();
  const document = page.locator('article').filter({ hasText: 'document · pending' }); await document.getByRole('checkbox').check(); await document.getByRole('button', { name: 'Publish', exact: true }).click(); await page.getByText('document · published · source_checked').waitFor();
  await page.goto(workUrl); await page.getByRole('heading', { name: 'Supporting documents', exact: true }).waitFor();
  assert.equal((await page.goto(base + '/works/999999999')).status(), 404);
  await mkdir('docs/screenshots', { recursive: true });
  const checks = [];
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/works', '/works/244718', '/works/244718/verify', '/works/244718/documents', '/admin/contributions']) {
      await page.goto(base + route); await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width} ${route}`);
      checks.push({ width, route, overflow: false });
      if (width === 390 && ['/works','/works/244718'].includes(route)) {
        const label = route === '/works' ? 'index' : 'work';
        await page.screenshot({ path: `docs/screenshots/civic-${label}-390.png`, fullPage: true });
        await page.screenshot({ path: `docs/screenshots/civic-${label}-viewport-390.png` });
      }
    }
  }
  assert.deepEqual(errors, []);
  await writeFile('docs/civic-loop-check.json', JSON.stringify({ passed: true, checkedAt: new Date().toISOString(), isolatedFixture: true, journey: 'PIN → MP → money → works → verify/photo → pending → moderation → published → source; supporting-source submission and publication', checks }, null, 2));
  console.log('PASS: both civic loops, private pending evidence, source access, 404 and 30 responsive route checks.');
} catch (e) { console.error(logs); throw e; }
finally { await browser?.close(); server.kill(); }
