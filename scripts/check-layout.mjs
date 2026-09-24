import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ reducedMotion: 'reduce' });
const results = [];
const governmentRequests=[];
page.on('request',request=>{if(/https:\/\/([^/]*sansad\.in|[^/]*mplads[^/]*\.gov\.in)/.test(request.url()))governmentRequests.push(request.url());});
await mkdir('docs/screenshots', { recursive: true });
for (const route of ['/', '/mp/mumbai-north-west', '/mp/ravindra-waikar', '/constituency/mumbai-north-west', '/methodology', '/mp/mumbai-north-west/records?view=questions&ministry=RAILWAYS', ...['questions','interventions','bills','committees','attendance','money','works','sources','affidavit'].map(view=>`/mp/mumbai-north-west/records?view=${view}`)]) {
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`http://127.0.0.1:3000${route}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if(route==='/mp/mumbai-north-west') {
      assert.equal(await page.locator('.story-image').count(),3,'Exactly three documentary moments');
      for(const photo of await page.locator('.story-image img').all()) {
        await photo.scrollIntoViewIfNeeded();
        await photo.evaluate(img=>img.decode());
        assert.ok(await photo.getAttribute('alt'),'Meaningful photographs need alt text');
      }
      const context=page.locator('.photo-context');
      assert.ok(await context.isVisible(),'Context disclaimer must not depend on disclosure');
      assert.match(await context.innerText(),/Not a documented MPLADS work/);
    }
    // Test disclosed factual records as well as the default composition.
    await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
    const result = await page.evaluate(() => {
      const errors = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const el = node.parentElement;
        if (!node.textContent.trim() || !el || el.closest('[aria-hidden="true"],.sr-only,script,style')) continue;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || !el.getClientRects().length) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width && (rect.left < -1 || rect.right > innerWidth + 1)) errors.push({ text: node.textContent.trim().slice(0, 80), left: rect.left, right: rect.right });
          const cell = el.closest('.grid12 > *');
          if (cell) { const c = cell.getBoundingClientRect(); if (rect.left < c.left - 2 || rect.right > c.right + 2) errors.push({ text: node.textContent.trim().slice(0, 80), reason: 'outside grid cell' }); }
          if(el.closest('.scroll-story')) {
            for(let item=el;item.parentElement;item=item.parentElement) {
              if(getComputedStyle(item.parentElement).display==='grid') {
                const c=item.getBoundingClientRect();
                if(rect.left<c.left-2||rect.right>c.right+2) errors.push({text:node.textContent.trim().slice(0,80),reason:'outside story grid cell'});
                break;
              }
            }
          }
          for (let parent = el; parent && parent !== document.body; parent = parent.parentElement) {
            const cs = getComputedStyle(parent), box = parent.getBoundingClientRect();
            if (['hidden','clip'].includes(cs.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) errors.push({text: node.textContent.trim().slice(0,80), reason:'clipped by ancestor'});
          }
        }
      }
      return { scrollWidth: document.documentElement.scrollWidth, width: innerWidth, errors };
    });
    results.push({ route, ...result });
    if(route==='/mp/mumbai-north-west') {
      await page.locator('#public-record > .moment-core > .fact-caption .source-trigger').click();
      const sheet=page.locator('dialog[open]');
      assert.ok(await sheet.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Source sheet text must not overflow');
      if([320,768,1440].includes(width)) await page.screenshot({path:`docs/screenshots/source-sheet-${width}.png`});
      await page.keyboard.press('Escape');
    }
    if (route==='/mp/mumbai-north-west' && [320,768,1440].includes(width)) {
      await page.locator('details').evaluateAll(nodes=>nodes.forEach(n=>n.open=false));
      await page.screenshot({ path: `docs/screenshots/mp-${width}.png`, fullPage: true });
      await page.locator('h1').scrollIntoViewIfNeeded();
      await page.screenshot({path:`docs/screenshots/mp-hero-${width}.png`});
      for (const id of ['place','parliament','money']) await page.locator(`#${id}`).screenshot({path:`docs/screenshots/story-${id}-${width}.png`});
    }
  }
}
await page.setViewportSize({width:320,height:800});
const profile=await (await page.request.get('http://127.0.0.1:3000/api/mps/mumbai-north-west')).json();
await page.goto('http://127.0.0.1:3000/mp/mumbai-north-west');
assert.equal(await page.locator('h1').count(),1);
assert.equal(await page.locator('.moment').count(),6);
assert.equal(await page.locator('.story-nav,.story-folio,.work-preview').count(),0);
assert.equal(await page.locator('.scroll-story details[open]').count(),0);
const photoCredit=page.locator('.story-image--place .photo-credit');
await photoCredit.locator('summary').focus();
await page.keyboard.press('Enter');
assert.equal(await photoCredit.evaluate(el=>el.open),true,'Photo credits work from the keyboard');
assert.match(await photoCredit.innerText(),/Rupturestriker|CC BY-SA 4.0/);
await page.keyboard.press('Enter');
const affidavit=page.locator('.affidavit-reveal');
await affidavit.locator(':scope > summary').focus();
await page.keyboard.press('Enter');
assert.equal(await affidavit.evaluate(el=>el.open),true,'Keyboard disclosure must work');
const source=page.locator('#public-record > .moment-core > .fact-caption .source-trigger');
await source.click();
await page.waitForSelector('dialog[open]');
assert.match(await page.locator('dialog[open]').innerText(),/Election Commission|affidavit/);
await page.keyboard.press('Escape');
assert.equal(await page.locator('dialog[open]').count(),0);
assert.equal(await source.evaluate(el=>el===document.activeElement),true,'Closing a source returns focus');
await page.locator('.parliament-reveal > summary').click();
await page.locator('.ministry-list a').filter({hasText:'RAILWAYS'}).click();
await page.waitForURL('**/records?view=questions&ministry=RAILWAYS');
assert.equal(await page.locator('#questions ol > li').count(),profile.parliamentaryRecords.questions.filter(q=>q.ministry.trim()==='RAILWAYS').length);
await page.getByRole('link',{name:'Show all questions',exact:true}).click();
await page.waitForURL('**/records?view=questions');
await page.waitForFunction(expected=>document.querySelectorAll('#questions ol > li').length===expected,profile.parliamentaryRecords.questions.length);
assert.equal(await page.locator('#questions ol > li').count(),profile.parliamentaryRecords.questions.length);
await page.locator('.record-tabs a', {hasText:'Works'}).click();
await page.waitForURL('**/records?view=works');
assert.equal(await page.locator('.record-browser ul.grid > li').count(),profile.projects.length);
await page.goto('http://127.0.0.1:3000/');
await page.locator('#lookup').fill('400053');
await page.locator('#lookup').press('Enter');
await page.waitForURL(url => new URL(url).pathname === '/mp/mumbai-north-west');
assert.match(await page.locator('#mp-name').innerText(),/RAVINDRA|Ravindra/);
await page.goto('http://127.0.0.1:3000/about');
await page.waitForURL('**/methodology');
assert.equal((await page.request.get('http://127.0.0.1:3000/api/mps?pin=400053')).status(),200);
assert.equal((await page.request.get('http://127.0.0.1:3000/api/mps?q=a')).status(),404);
assert.deepEqual(governmentRequests,[],'Citizen pages must not request government APIs');
await browser.close();
await writeFile('docs/layout-check.json', JSON.stringify(results, null, 2));
const failures = results.filter(r => r.errors.length || r.scrollWidth > r.width + 1);
console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
