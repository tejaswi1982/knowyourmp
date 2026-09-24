import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// A portable review artifact; it never changes the running app or data.
const origin = 'http://127.0.0.1:3000';
const member = '/mp/mumbai-north-west';
const views = ['questions','interventions','bills','committees','attendance','works','money','affidavit','sources'];
const routes = [['home','/'],['story',member],['methodology','/methodology'],...views.map(view=>[view,`${member}/records?view=${view}`])];
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
  const page = await browser.newPage();
  const templates=[];
  const sheets = new Set();
  const images = new Map();
  const profileResponse=await fetch(origin+'/api/mps/mumbai-north-west');
  if(!profileResponse.ok)throw new Error('Cannot read pilot coverage');
  const profile=await profileResponse.json();
  const pins=[];
  for(const pin of profile.constituency.samplePins) {
    const response=await fetch(origin+'/api/mps?pin='+encodeURIComponent(pin));
    const match=await response.json();
    if(response.ok&&match.href===member)pins.push(pin);
  }
  let htmlClass='';
  for(const [id,route] of routes) {
    await page.goto(origin+route,{waitUntil:'networkidle'});
    const content=await page.evaluate(()=>{
      const body=document.body.cloneNode(true);
      body.querySelectorAll('script,next-route-announcer').forEach(node=>node.remove());
      return {html:body.innerHTML,images:[...body.querySelectorAll('img')].map(node=>node.getAttribute('src')),htmlClass:document.documentElement.className,sheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(node=>node.getAttribute('href'))};
    });
    htmlClass=content.htmlClass;
    content.sheets.forEach(sheet=>sheets.add(sheet));
    for(const src of content.images) {
      if(!images.has(src)) {
        const url=new URL(src,origin);
        if(url.origin!==origin)throw new Error(`Unexpected external photograph ${url}`);
        const response=await fetch(url);
        if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error(`Photograph failed: ${url}`);
        images.set(src,`data:${response.headers.get('content-type')};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`);
      }
      content.html=content.html.replaceAll(`src="${src}"`,`src="${images.get(src)}"`);
    }
    templates.push(`<template id="review-${id}">${content.html}</template>`);
  }
  let css='';
  for(const href of sheets) {
    const response=await fetch(origin+href);
    if(!response.ok) throw new Error(`Stylesheet failed: ${href}`);
    let sheet=await response.text();
    const urls=[...new Set([...sheet.matchAll(/url\(([^)]+)\)/g)].map(match=>match[1].replace(/^["']|["']$/g,'')))];
    for(const url of urls) {
      if(url.startsWith('data:')) continue;
      const resolved=new URL(url,origin+href);
      if(resolved.origin!==origin) throw new Error(`Unexpected external asset ${resolved}`);
      const response=await fetch(resolved);
      if(!response.ok) throw new Error(`Asset failed: ${resolved}`);
      const type=resolved.pathname.endsWith('.woff2')?'font/woff2':response.headers.get('content-type')??'application/octet-stream';
      const data=`data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
      sheet=sheet.split(url).join(data);
    }
    css+=sheet+'\n';
  }
  const exportedAt=new Date().toISOString();
  css+='\n#review-content:has(.entry-page)>header,#review-content:has(.entry-page)>footer,#review-content:has(.scroll-story)>header,#review-content:has(.scroll-story)>footer{display:none}';
  css+='\n#review-content .entry-page,#review-content .entry-content{min-height:calc(100svh - var(--review-bar-height,0px))}';
  const script=`
    const outlet=document.getElementById('review-content');
    let placeObserver;
    const supportedPins=${JSON.stringify(pins)};
    const pinLocalities=${JSON.stringify(profile.constituency.pinLocalities ?? {})};
    function measureReviewBar(){document.documentElement.style.setProperty('--review-bar-height',document.getElementById('review-info').offsetHeight+'px');}
    window.addEventListener('resize',measureReviewBar);
    function show(){
      measureReviewBar();
      const raw=location.hash.slice(1);
      const [route,query]=raw.startsWith('view/')?raw.slice(5).split('?'):[raw?'story/'+raw:'home',''];
      const [view,anchor]=route.split('/');
      const ministry=new URLSearchParams(query).get('ministry');
      const template=document.getElementById('review-'+view)||document.getElementById('review-story');
      const key=template.id+'|'+(ministry||'');
      if(outlet.dataset.state!==key){
        outlet.replaceChildren(template.content.cloneNode(true));outlet.dataset.view=template.id;outlet.dataset.state=key;
        const selectedPin=new URLSearchParams(query).get('pin');
        if(selectedPin&&supportedPins.includes(selectedPin)){
          const pinNode=outlet.querySelector('.place-pin'), localityNode=outlet.querySelector('.place-name'), markerNode=outlet.querySelector('.place-marker');
          if(pinNode)pinNode.textContent=selectedPin;
          if(localityNode)localityNode.textContent=pinLocalities[selectedPin]||'Mumbai North-West';
          if(markerNode)markerNode.textContent=selectedPin+' / MH-27';
        }
        if(view==='questions'&&ministry){
          let count=0;outlet.querySelectorAll('[data-ministry]').forEach(row=>{row.hidden=row.dataset.ministry!==ministry;if(!row.hidden)count++;});
          const caption=outlet.querySelector('[data-ministry-context]');
          if(caption){caption.textContent='Ministry: '+ministry+' · '+count+' records. ';const all=document.createElement('a');all.href='?view=questions';all.className='underline';all.textContent='Show all questions';caption.append(all);}
          const summary=outlet.querySelector('#questions > summary');if(summary)summary.textContent='Questions · '+count+' stored records';
        }
        placeObserver?.disconnect();
        const place=outlet.querySelector('#place'),marker=outlet.querySelector('.place-marker');
        if(place&&marker){placeObserver=new IntersectionObserver(([entry])=>marker.classList.toggle('is-visible',!entry.isIntersecting&&entry.boundingClientRect.top<0));placeObserver.observe(place);}
      }
      requestAnimationFrame(()=>{const target=anchor&&document.getElementById(anchor);if(target)target.scrollIntoView();else window.scrollTo(0,0);});
    }
    document.addEventListener('click',event=>{
      const source=event.target.closest('[data-source-open]');if(source){document.getElementById(source.dataset.sourceOpen)?.showModal();return;}
      if(event.target instanceof HTMLDialogElement){event.target.close();return;}
      const a=event.target.closest('a');if(!a)return;
      const href=a.getAttribute('href');if(!href||/^(https?:|mailto:|tel:)/.test(href))return;
      if(href.startsWith('#'))return;
      event.preventDefault();
      const u=new URL(href,'${origin}'+(outlet.dataset.view==='review-home'?'/':outlet.dataset.view==='review-story'?'${member}':'${member}/records'));
      if(u.pathname.endsWith('/records'))location.hash='view/'+(u.searchParams.get('view')||'questions')+(u.searchParams.has('ministry')?'?ministry='+encodeURIComponent(u.searchParams.get('ministry')):'');
      else if(u.pathname==='/methodology'||u.pathname==='/about')location.hash='view/methodology/'+u.hash.slice(1);
      else if(u.pathname.startsWith('/mp/'))location.hash='view/story/'+u.hash.slice(1);
      else if(u.pathname==='/')location.hash='view/home';
      else {document.getElementById('review-info').focus();}
    });
    document.addEventListener('submit',event=>{
      if(!event.target.matches('.entry-form'))return;
      event.preventDefault();
      const input=event.target.querySelector('#lookup'),status=event.target.querySelector('#entry-status'),pin=input.value.trim();
      const error=!/^[1-9][0-9]{5}$/.test(pin)?'Enter a six-digit PIN code, starting with a non-zero digit.':!supportedPins.includes(pin)?'This PIN is not covered yet. Try 400053 for the Mumbai North-West pilot.':'';
      input.setAttribute('aria-invalid',String(!!error));status.textContent=error;
      if(error)input.focus();else location.hash='view/story?pin='+encodeURIComponent(pin);
    });
    document.addEventListener('input',event=>{
      if(event.target.id==='lookup'){event.target.setAttribute('aria-invalid','false');document.getElementById('entry-status').textContent='';}
    });
    window.addEventListener('hashchange',show);show();
  `;
  const html=`<!doctype html><html lang="en-IN" class="${htmlClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KnowYourMP  -  review copy</title><style>${css}</style><style>#review-info{padding:10px 20px;background:#fff;color:#333;border-bottom:1px solid #ccc;font:12px/1.5 system-ui}#review-info a{text-decoration:underline}#review-content{min-height:100vh}</style></head><body><aside id="review-info" tabindex="-1">Standalone review copy · exported ${exportedAt.slice(0,10)} · Saved data, not a live feed. PIN lookup uses the included pilot coverage. Records and methodology work offline; source links require internet. <a href="#view/home">Home</a> · <a href="#view/story">MP story</a></aside><div id="review-content"></div>${templates.join('\n')}<script>${script}</script></body></html>`;
  await mkdir('exports',{recursive:true});
  const file=path.resolve('exports/KnowYourMP-review.html');
  await writeFile(file,html);
  // Verify the delivered artifact without a server or any network access.
  await page.route('https://**/*',route=>route.abort());
  await page.route('http://**/*',route=>route.abort());
  await page.goto(new URL('file:///'+file.replaceAll('\\','/')).href);
  await page.waitForSelector('.entry-page');
  await page.locator('.entry-photo').evaluate(img=>img.decode());
  await page.locator('#lookup').fill('110001');
  await page.locator('#lookup').press('Enter');
  if(!(await page.locator('#entry-status').innerText()).includes('not covered'))throw new Error('Offline coverage state failed');
  await page.locator('#lookup').fill('400053');
  await page.locator('#lookup').press('Enter');
  await page.waitForSelector('.place-pin');
  for(const photo of await page.locator('.story-image img').all()) {
    await photo.scrollIntoViewIfNeeded();
    await photo.evaluate(img=>img.decode());
  }
  const offlinePhotos=await page.locator('.story-image img').evaluateAll(nodes=>nodes.filter(img=>img.complete&&img.naturalWidth>0&&img.src.startsWith('data:')).length);
  if(offlinePhotos!==3)throw new Error('All three photographs must work offline');
  await page.setViewportSize({width:320,height:800});
  await page.locator('#public-record > .moment-core > .fact-caption .source-trigger').click();
  await page.waitForSelector('dialog[open]');
  const sheetWidth=await page.locator('dialog[open]').evaluate(el=>el.getBoundingClientRect().width);
  if(Math.abs(sheetWidth-320)>1)throw new Error('Mobile source sheet should fill the width');
  await page.screenshot({path:'exports/KnowYourMP-source-mobile.png'});
  await page.keyboard.press('Escape');
  await page.locator('.parliament-reveal > summary').click();
  await page.locator('.ministry-list a').filter({hasText:'RAILWAYS'}).click();
  await page.waitForSelector('#questions ol > li:visible');
  const filteredQuestions=await page.locator('#questions ol > li:visible').count();
  if(filteredQuestions!==22)throw new Error('Offline ministry filtering failed');
  await page.getByRole('link',{name:'Show all questions',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-ministry-context]')?.textContent==='All ministries');
  const questions=await page.locator('#questions ol > li:visible').count();
  await page.locator('.record-tabs a',{hasText:'Works'}).click();
  await page.waitForSelector('.record-browser ul.grid > li');
  const works=await page.locator('.record-browser ul.grid > li').count();
  await page.goto(new URL('file:///'+file.replaceAll('\\','/')+'#view/story').href);
  await page.waitForSelector('.place-pin');
  await page.setViewportSize({width:375,height:900});
  await page.screenshot({path:'exports/KnowYourMP-review-mobile.png'});
  await page.locator('.quiet-brand').click();
  await page.waitForSelector('.entry-page');
  await page.screenshot({path:'exports/KnowYourMP-home-mobile.png'});
  console.log(JSON.stringify({file,bytes:Buffer.byteLength(html),offlineHome:true,offlineMappedPins:pins.length,offlinePhotos:offlinePhotos+1,offlineQuestions:questions,offlineFilteredQuestions:filteredQuestions,offlineWorks:works}));
} finally { await browser.close(); }
