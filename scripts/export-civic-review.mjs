import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { randomBytes, randomInt } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import assert from 'node:assert/strict';

// Captures real rendered states; never pretends a standalone file submits evidence.
const store = await mkdtemp(path.join(tmpdir(), 'civic-export-'));
const token = randomBytes(32).toString('hex');
const base = `http://127.0.0.1:${randomInt(32000, 42000)}`;
const port = new URL(base).port;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', port], { env: { ...process.env, CIVIC_STORAGE_DIR: store, CIVIC_ADMIN_TOKEN: token }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let logs = ''; server.stdout.on('data', b => { logs += b; }); server.stderr.on('data', b => { logs += b; });
let browser;
const screens = [];
const fixture = await sharp(Buffer.from('<svg width="900" height="600"><rect width="900" height="600" fill="#dddcd2"/><text x="55" y="265" font-size="48" font-family="sans-serif" fill="#262722">REVIEW FIXTURE</text><text x="55" y="330" font-size="25" font-family="sans-serif" fill="#262722">Not a photograph of this public work.</text></svg>')).jpeg().toBuffer();
try {
  for (let i = 0; i < 60; i++) { if (server.exitCode !== null) throw new Error(logs); try { if ((await fetch(base + '/api/works')).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  async function capture(id, label, description, selector) {
    const shots = {};
    for (const width of [375, 430]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      for (const image of await page.locator('img').all()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(img => img.decode().catch(() => undefined)); }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflow at ${width}`);
      if (selector) await page.locator(selector).scrollIntoViewIfNeeded(); else await page.evaluate(() => scrollTo(0, 0));
      const bytes = selector ? await page.locator(selector).screenshot({ type: 'jpeg', quality: 83 }) : await page.screenshot({ type: 'jpeg', quality: 83, fullPage: true });
      shots[width] = `data:image/jpeg;base64,${bytes.toString('base64')}`;
    }
    screens.push({ id, label, description, route: new URL(page.url()).pathname, shots });
    await page.setViewportSize({ width: 375, height: 900 });
    console.log(`Captured: ${label}`);
  }
  const next = () => page.getByRole('button', { name: 'Continue →', exact: true }).click();
  await page.goto(base, {waitUntil:'networkidle'});
  await capture('home', 'Homepage', 'Enter 400053 to open the existing Mumbai North-West pilot.');
  await page.locator('input[name=pin]').fill('400053'); await page.getByRole('button', { name: 'Find your MP' }).click(); await page.waitForURL(url => new URL(url).pathname === '/mp/mumbai-north-west');
  await capture('story', 'MP Story', 'Ravindra Dattaram Waikar, Mumbai North-West. Existing story preserved.');
  assert.equal(await page.locator('#money .money-reveal').getAttribute('open'), null);
  await capture('money', 'Public money CTA', '67 public works and Explore public works are visible without opening the financial disclosure.', '#money');
  await page.getByRole('link', { name: 'Explore public works →', exact: true }).click(); await page.waitForURL(url => new URL(url).pathname === '/works');
  await capture('works', 'Works', 'All 67 real projects, literal locality/work search, source statuses and official categories.');
  await page.getByRole('link', { name: 'View work →', exact: true }).click(); await page.waitForURL('**/works/244718');
  await capture('work', 'Demo Work', 'Work 244718. Both official report statuses remain visible. No citizen evidence has been published yet in this export fixture.');
  await page.getByRole('button', { name: 'Source for Official sources for work 244718' }).click();
  await capture('source', 'Official source', 'Actual official source disclosure: report titles, retrieval date, period and dashboard-selection instructions.', 'dialog[open]');
  await page.getByRole('button', { name: 'Close source' }).click();
  await page.getByRole('link', { name: 'Verify this work →', exact: true }).click();
  await page.getByRole('heading', { name: 'Confirm project', exact: true }).waitFor();
  await capture('project', 'Verify · 1 Project', 'All five stage labels remain visible. Project, location description, amount and conflicting official statuses are connected to the work.');
  await page.getByRole('radio', { name: 'No', exact: true }).check(); await next();
  await capture('observation', 'Verify · 2 Observation', 'Nine existing neutral observation choices. No political opinion or accusation is required.');
  await page.getByRole('radio', { name: 'Work appears ongoing', exact: true }).check(); await next();
  await capture('photo-empty', 'Verify · 3 Photo upload', 'Visible device-upload and mobile-camera controls, limits and relevant privacy guidance.');
  await page.getByLabel('Upload from device', { exact: true }).setInputFiles({ name: 'review-fixture.jpg', mimeType: 'image/jpeg', buffer: fixture });
  await capture('photo', 'Verify · 3 Photo attached', 'The attached image is explicitly a review fixture, not evidence about the real project.');
  await next(); await page.getByLabel('Optional factual note').fill('Review fixture only. This does not describe the condition of the real work.');
  await capture('note', 'Verify · 4 Note', 'Factual guidance, optional note and observation date.');
  await next(); await page.getByRole('checkbox').check();
  await capture('review', 'Verify · 5 Review', 'The actual connected project, chosen observation, attached photo, note, date and required acknowledgement.');
  await page.getByRole('button', { name: 'Submit for review' }).click(); await page.getByText('Evidence received · Pending moderation', { exact: true }).waitFor();
  await capture('confirmation', 'Submission confirmation', 'Not public yet; approval required; official data unchanged. Return to project is explicit.');
  await page.getByRole('link', { name: 'Return to project →' }).click(); await page.waitForURL('**/works/244718#citizen-checks');
  assert.equal(await page.locator('#citizen-checks .civic-evidence').count(), 0);
  await capture('pending-public', 'Public record while pending', 'Pending evidence is absent from Citizen checks.', '#citizen-checks');
  await page.goto(base + '/admin/contributions'); await page.getByLabel('Admin token').fill(token); await page.getByRole('button', { name: 'Open moderation queue' }).click(); await page.getByRole('button', { name: 'Needs review', exact: true }).waitFor();
  await capture('admin', 'Admin · pending', 'Authenticated local moderator view. The token and session cookie are never exported.');
  await page.getByRole('button', { name: 'Needs review', exact: true }).click(); await page.getByText('observation · needs_review · unverified', { exact: true }).waitFor();
  await capture('needs-review', 'Admin · needs review', 'Needs review was exercised; evidence stays private.');
  await page.getByRole('button', { name: 'Reject', exact: true }).click(); await page.getByText('observation · rejected · unverified', { exact: true }).waitFor();
  await capture('rejected', 'Admin · rejected', 'Reject was exercised on this disposable review fixture; it remains hidden publicly.');
  await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Publish', exact: true }).click(); await page.getByText('observation · published · unverified', { exact: true }).waitFor();
  await capture('published-admin', 'Admin · published', 'Publish changes visibility, not the official record or the independent verification state.');
  await page.getByRole('link', { name: 'Work 244718 ↗', exact: true }).click(); await page.waitForURL('**/works/244718');
  await page.getByRole('heading', { name: '1 published observation', exact: true }).waitFor();
  await capture('published', 'Work after publication', 'The approved test observation now appears in Citizen checks, distinctly below Official record.');
  await capture('citizen', 'Citizen checks', 'Citizen label, observation/date, privacy-safe proximity and test photograph. No official values are changed.', '#citizen-checks');
  // Capture the existing supporting-source layer through its actual submission flow.
  await page.getByRole('link', { name: 'Submit a document or source →' }).click(); await page.getByRole('heading', { name: 'Confirm project', exact: true }).waitFor(); await next();
  await page.getByRole('radio', { name: 'Completion date', exact: true }).check(); await next(); await page.getByLabel('Public source URL (HTTPS)').fill('https://mplads.mospi.gov.in/digigov/dashboard.html'); await next(); await page.getByLabel('Short explanation').fill('Review fixture source submission. This dashboard does not establish a completion date.'); await next(); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: 'Submit for review' }).click(); await page.getByText('Evidence received · Pending moderation', { exact: true }).waitFor();
  await page.goto(base + '/admin/contributions'); await page.getByLabel('Admin token').fill(token); await page.getByRole('button', { name: 'Open moderation queue' }).click();
  const sourceItem = page.locator('article').filter({ hasText: 'document · pending' }); await sourceItem.getByRole('checkbox').check(); await sourceItem.getByRole('button', { name: 'Publish', exact: true }).click(); await page.getByText('document · published · source_checked', { exact: true }).waitFor();
  await page.goto(base + '/works/244718');
  await capture('documents', 'Supporting documents', 'Separate supporting-source display, using an explicitly labelled export fixture. It does not fill the official completion date. No authority response is fabricated.');
  await page.goto(base + '/methodology'); await capture('methodology', 'Methodology', 'Existing methodology remains available; official external sources require internet.');
  assert.deepEqual(errors, []);
  const exportedAt = new Date().toISOString();
  const output = path.resolve('exports/KnowYourMP-civic-loop-review.html');
  const nav = screens.map((s,i) => `<a href="#${s.id}" data-state="${s.id}">${i + 1}. ${s.label}</a>`).join('');
  // Only screenshot bytes and explicit review metadata enter the file; no DOM secrets.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KnowYourMP · Civic loop review</title><style>
  *{box-sizing:border-box}body{margin:0;background:#eeeee7;color:#242522;font:15px/1.6 system-ui,sans-serif}header{padding:22px clamp(18px,4vw,48px);border-bottom:1px solid #b6b7ac;background:#f8f8f2}h1{font-size:26px;line-height:1.2;margin:0 0 14px}header p{max-width:1000px;margin:8px 0}a{color:inherit;text-underline-offset:4px}nav{display:flex;flex-wrap:wrap;gap:8px 22px}nav a{padding:8px 0}nav a[aria-current=page]{font-weight:700;color:#2526ed}.review-shell{display:grid;grid-template-columns:230px minmax(0,1fr);max-width:1300px;margin:auto}aside{padding:24px;align-self:start;position:sticky;top:0;max-height:100vh;overflow:auto}aside a{display:block;padding:7px 0}main{padding:24px;min-width:0}.state-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}button{font:inherit;padding:10px 16px;border:1px solid #727469;background:transparent;cursor:pointer}button[aria-pressed=true]{background:#242522;color:white}button:disabled{opacity:.4}h2{font-size:24px;margin:18px 0 8px}figure{margin:20px 0;background:white;max-width:100%;width:max-content;border:1px solid #c5c5b8}img{display:block;max-width:100%;height:auto}#route{font-size:13px;color:#555}#description{max-width:720px}footer{padding:20px 0}.notice{font-size:13px;color:#50524b}a:focus-visible,button:focus-visible{outline:3px solid #2526ed;outline-offset:3px}@media(max-width:720px){.review-shell{display:block}aside{position:static;max-height:none;padding:12px 18px;border-bottom:1px solid #b6b7ac}aside details:not([open]){margin:0}main{padding:18px}header{padding:18px}}
  </style></head><body><header><h1>KnowYourMP · The complete civic loop</h1><p>Rendered application states · ${exportedAt.slice(0,10)} · 375 px and 430 px.</p><p class="notice"><strong>Visual review, not a live form.</strong> Use the review navigation to inspect each captured state. Screenshots are not interactive. Photographs, citizen notes and moderation shown here are isolated test fixtures, not claims about this project. This file cannot submit, publish or change data. No admin credentials are included.</p><nav aria-label="Quick review navigation"><a href="#home">Homepage</a><a href="#story">MP Story</a><a href="#money">Public money</a><a href="#works">Works</a><a href="#work">Demo Work</a><a href="#project">Verify</a><a href="#admin">Admin</a><a href="#citizen">Citizen checks</a></nav></header><div class="review-shell"><aside><details open><summary>All captured states</summary><nav aria-label="Review sequence">${nav}</nav></details></aside><main><div class="state-bar"><button id="previous">← Previous</button><button id="next">Next →</button><button data-width="375" aria-pressed="true">375 px</button><button data-width="430" aria-pressed="false">430 px</button></div><h2 id="title" tabindex="-1"></h2><p id="route"></p><p id="description"></p><figure><img id="screen" alt=""></figure><footer><p>Official source: <a href="https://mplads.mospi.gov.in/digigov/dashboard.html" target="_blank" rel="noreferrer">MoSPI MPLADS dashboard ↗</a>. Select Maharashtra → Mumbai North West → Ravindra Dattaram Waikar → 18th Lok Sabha.</p><p class="notice">Authority / representative response remains an empty architectural slot and is correctly omitted from the live work page. No response has been invented for this review.</p></footer></main></div><script>
  const states=${JSON.stringify(screens).replaceAll('<','\\u003c')};let width=375;let current=0;
  function show(){const found=states.findIndex(s=>s.id===location.hash.slice(1));current=found<0?0:found;const s=states[current];document.getElementById('title').textContent=s.label;document.getElementById('route').textContent='Application route: '+s.route;document.getElementById('description').textContent=s.description;const img=document.getElementById('screen');img.src=s.shots[width];img.width=width;img.alt=s.label+'  -  actual rendered application at '+width+' px';document.getElementById('previous').disabled=current===0;document.getElementById('next').disabled=current===states.length-1;document.querySelectorAll('[data-state]').forEach(a=>a.setAttribute('aria-current',a.dataset.state===s.id?'page':'false'));document.querySelectorAll('[data-width]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.width)===width)));}
  document.getElementById('previous').onclick=()=>{location.hash=states[current-1].id};document.getElementById('next').onclick=()=>{location.hash=states[current+1].id};document.querySelectorAll('[data-width]').forEach(b=>b.onclick=()=>{width=Number(b.dataset.width);show()});window.addEventListener('hashchange',()=>{show();document.getElementById('title').focus();scrollTo(0,0)});show();
  </script></body></html>`;
  assert.ok(!html.includes(token));
  await mkdir('exports', { recursive: true }); await writeFile(output, html);
  await page.route('http://**/*', r => r.abort()); await page.route('https://**/*', r => r.abort());
  await page.goto(pathToFileURL(output).href);
  for (const state of screens) {
    await page.locator(`[data-state="${state.id}"]`).click();
    await page.waitForFunction((src) => document.getElementById('screen')?.getAttribute('src') === src, state.shots[375]);
    await page.locator('#screen').evaluate(img => img.decode());
    assert.equal(await page.locator('#title').innerText(), state.label);
  }
  await page.getByRole('button', { name: '430 px', exact: true }).click(); assert.equal(await page.locator('#screen').getAttribute('width'), '430');
  await writeFile('exports/civic-review-manifest.json', JSON.stringify({ exportedAt, file: output, offlineVerified: true, widths: [375, 430], stateCount: screens.length, states: screens.map(({shots: _shots,...s}) => s) }, null, 2));
  console.log(`PASS: ${screens.length} rendered states at both widths, offline navigation verified. ${output}`);
} catch(e) { console.error(logs); throw e; }
finally { await browser?.close(); server.kill(); }
