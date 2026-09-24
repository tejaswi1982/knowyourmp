import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({reducedMotion:'reduce'});
const origin='http://127.0.0.1:3000';
const checks=[];
await mkdir('docs/screenshots',{recursive:true});
try {
  for(const [width,height] of [[320,700],[375,812],[430,932],[768,1000],[1024,900],[1280,900],[1440,900],[844,390],[375,500]]) {
    await page.setViewportSize({width,height});
    await page.goto(origin,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('.entry-photo').evaluate(img=>img.decode());
    assert.equal(await page.locator('h1').innerText(),'Enter your PIN code');
    assert.equal(await page.locator('.entry-page input').count(),1);
    assert.equal(await page.locator('.entry-page button').count(),1);
    assert.equal(await page.locator('.entry-photo').count(),1);
    assert.equal(await page.locator('#lookup').getAttribute('inputmode'),'numeric');
    const result=await page.evaluate(()=>{
      const button=document.querySelector('.entry-field-row button').getBoundingClientRect();
      return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,buttonBottom:button.bottom,buttonHeight:button.height};
    });
    assert.ok(result.scrollWidth<=width+1,'No horizontal overflow');
    assert.ok(result.buttonHeight>=44,'Action target size');
    if(height>=700)assert.ok(result.buttonBottom<=height,'Action is visible on the first screen');
    await page.screenshot({path:`docs/screenshots/home-${width}-${height}.png`,fullPage:true});
    const regions=await page.locator('.entry-brand,.entry-invitation h1,.entry-field-row input,.entry-field-row button,#entry-help,.entry-footer > a,.entry-credit summary').evaluateAll(nodes=>nodes.map(el=>{
      const rect=el.getBoundingClientRect(),style=getComputedStyle(el,el.tagName==='INPUT'?'::placeholder':null);
      return {name:el.className||el.tagName,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},color:style.color,required:parseFloat(style.fontSize)>=24?3:4.5};
    }));
    // Sample the actual composited photograph behind every text/control box,
    // with interface text hidden. Worst-pixel contrast is conservative.
    await page.locator('.entry-content').evaluate(el=>el.style.opacity='0');
    const backdrop=(await page.screenshot({fullPage:true})).toString('base64');
    await page.locator('.entry-content').evaluate(el=>el.style.opacity='');
    result.contrast=await page.evaluate(async({backdrop,regions})=>{
      const img=new Image();img.src='data:image/png;base64,'+backdrop;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
      const context=canvas.getContext('2d');context.drawImage(img,0,0);
      const pixels=context.getImageData(0,0,img.width,img.height).data;
      const light=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
      return regions.map(region=>{
        const values=region.color.match(/[\d.]+/g).map(Number),alpha=values[3]??1,r=region.rect;
        let minimum=Infinity;
        for(let y=Math.max(0,Math.floor(r.y));y<Math.min(img.height,r.y+r.height);y+=2)for(let x=Math.max(0,Math.floor(r.x));x<Math.min(img.width,r.x+r.width);x+=2){
          const offset=(y*img.width+x)*4,bg=[pixels[offset],pixels[offset+1],pixels[offset+2]],fg=bg.map((v,i)=>values[i]*alpha+v*(1-alpha));
          const a=light(bg),b=light(fg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);minimum=Math.min(minimum,ratio);
        }
        return {name:region.name,color:region.color,minimum:Number(minimum.toFixed(2)),required:region.required};
      });
    },{backdrop,regions});
    for(const contrast of result.contrast)assert.ok(contrast.minimum>=contrast.required,`${width}×${height} ${JSON.stringify(contrast)}`);
    // Empty, short, long, letter-containing and unavailable PINs are distinct
    // from successful lookups; a long pasted value must never be truncated.
    for(const value of ['', '40005','4000537','40ab53','000000','110001']) {
      await page.locator('#lookup').fill(value);
      await page.locator('#lookup').press('Enter');
      await page.waitForFunction(()=>document.querySelector('#lookup').getAttribute('aria-invalid')==='true');
      assert.equal(await page.locator('#lookup').inputValue(),value);
      assert.match(await page.locator('#entry-status').innerText(),value==='110001'?/not covered/:/six-digit/);
      assert.equal(await page.locator('#lookup').evaluate(el=>el===document.activeElement),true);
      assert.equal(new URL(page.url()).pathname,'/');
    }
    await page.locator('#lookup').fill('400053');
    assert.ok(await page.locator('#lookup').evaluate(el=>el.scrollWidth<=el.clientWidth),'All six input digits fit');
    await page.locator('#lookup').press('Tab');
    assert.equal(await page.locator('.entry-field-row button').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');
    await page.waitForURL(url => new URL(url).pathname === '/mp/mumbai-north-west');
    assert.equal(await page.locator('.place-pin').innerText(),'400053');
    assert.equal(await page.locator('.moment').count(),6);
    checks.push(result);
  }
  // Preserve all existing mapped PINs, without extending coverage.
  for(const pin of ['400058','400061','400062','400102','400104']) {
    await page.goto(origin);
    await page.locator('#lookup').fill(pin);
    await page.locator('#lookup').press('Enter');
    await page.waitForURL(url => new URL(url).pathname === '/mp/mumbai-north-west');
    assert.equal(new URL(page.url()).searchParams.get('pin'),pin,'Selected PIN is preserved in the MP route');
    assert.equal(await page.locator('.place-pin').innerText(),pin,'Story shows the PIN that was entered');
    assert.equal(await page.locator('.follow-area button').innerText(),`Follow ${pin}`,'Follow control uses the selected PIN');
  }
  await page.goto(origin);
  await page.locator('.entry-credit summary').focus();
  await page.keyboard.press('Enter');
  assert.match(await page.locator('.entry-credit').innerText(),/Rsrikanth05/);
  assert.match(await page.locator('.entry-credit').innerText(),/CC BY-SA 3.0/);
  await page.locator('.entry-footer > a').click();
  await page.waitForURL('**/methodology');
  // Photograph failure cannot remove the form or prevent entry.
  await page.route('**/story/andheri-flyover.jpg',route=>route.abort());
  await page.goto(origin);
  assert.ok(await page.locator('#lookup').isVisible());
  await page.locator('#lookup').fill('400053');
  await page.locator('#lookup').press('Enter');
  await page.waitForURL(url => new URL(url).pathname === '/mp/mumbai-north-west');
  await writeFile('docs/homepage-check.json',JSON.stringify(checks,null,2));
  console.log(JSON.stringify({viewports:checks.length,invalidInputs:54,mappedPins:6,keyboard:true,photoFallback:true,checks}));
} finally {await browser.close();}
