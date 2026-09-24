import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { questionPage, debatePage, billPage, committeeRecords, attendanceRecord } from '../lib/ingestion/sansad/parse';
import { summaryTiles, workRows, joinWorkReports } from '../lib/ingestion/mplads/parse';
import { date, money } from '../lib/ingestion/validate';
import { hashContent } from '../lib/ingestion/core';
import { readPublished } from '../lib/ingestion/storage';
import { deriveParliamentaryTotals, deriveAttendance } from '../lib/parliament';
import { validateRecords } from '../lib/ingestion/sansad/normalise';
import { lookup } from '../lib/lookup';
import { formatRupees } from '../lib/format';
import type { SansadPayload } from '../lib/ingestion/sansad/types';
import type { MpladsPayload } from '../lib/ingestion/mplads/types';
import type { ParliamentaryRecords } from '../types/civic';

const read=(file:string)=>readFileSync(`tests/fixtures/${file}.json`,'utf8');
const manifest=(body:string)=>({sourceUrl:'https://sansad.in/api_ls/member/5701?locale=en',retrievedAt:'2026-09-20T00:00:00Z',parserVersion:'test',contentHash:hashContent(body)});
const sansad=(dataset:SansadPayload['dataset'],file=dataset):SansadPayload=>{const body=read(file);return {dataset,sansadMemberId:'5701',body,manifest:manifest(body)};};
const mplads=(file:string,key?:string):MpladsPayload=>{const body=read(`mplads-${file}`);return {dataset:file==='summary'?'summary':'works',constituencyCode:'270',mpladsMemberId:'3042793',reportKey:key,body,manifest:{...manifest(body),sourceUrl:'https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData'}};};
const empty=():ParliamentaryRecords=>({questions:[],interventions:[],bills:[],attendance:[],committees:[]});

test('official question envelope, date, answer URL and provenance survive parsing',()=>{
  const p=sansad('questions'), q=questionPage(p);
  assert.equal(q.total,243); assert.equal(q.records.length,10);
  assert.equal(q.records[0].date,'2026-08-10');
  assert.equal(q.records[0].session,'8');
  assert.equal(q.records[0].provenance?.contentHash,p.manifest.contentHash);
  assert.match(q.records[0].answerUrl!,/^https:\/\/sansad.in\/getFile\//);
});
test('malformed, wrong-member, duplicate and unknown-type questions fail closed',()=>{
  for(const mutate of [(d:any)=>delete d[0].listOfQuestions,(d:any)=>d[0].listOfQuestions.push(d[0].listOfQuestions[0]),(d:any)=>d[0].listOfQuestions[0].member=[],(d:any)=>d[0].listOfQuestions[0].type='UNKNOWN']) {
    const p=sansad('questions'),d=JSON.parse(p.body);mutate(d);p.body=JSON.stringify(d);assert.throws(()=>questionPage(p));
  }
  assert.throws(()=>questionPage({...sansad('questions'),body:'<html>Service unavailable</html>'}));
});
test('debates require official participant ID, not a name occurrence',()=>{
  const p=sansad('debates'); assert.equal(debatePage(p).total,51);
  const d=JSON.parse(p.body); d.records[0].mpPartDetailList=[];
  assert.throws(()=>debatePage({...p,body:JSON.stringify(d)}));
});
test('private bills only count explicit sole-member introductions',()=>{
  const p=sansad('bills');assert.equal(billPage(p).records.length,3);
  const d=JSON.parse(p.body); d.records[0].debateTitle='Discussion on a bill';
  assert.throws(()=>billPage({...p,body:JSON.stringify(d)}));
});
test('committee terms retain expired membership dates',()=>{
  const r=committeeRecords(sansad('committees')); assert.equal(r.length,3);assert.equal(r[2].until,'2025-09-25');
});
test('attendance calendar conflict cannot produce a denominator or percentage',()=>{
  const p=sansad('attendance'),s=JSON.parse(read('sessions'))[0].sessions.find((s:any)=>s.sessionNo===7);
  const r=attendanceRecord({...p,session:'7',sessionDates:s.dates,calendarManifest:manifest(read('sessions'))});
  assert.equal(r.signedDays,31);assert.equal(r.eligibleDays,undefined);assert.equal(r.missingDays,2);assert.equal(r.outsideCalendarDates?.length,3);
  assert.equal(deriveAttendance([r]).percentage,null);
});
test('attendance sanity and missing provenance block publication',()=>{
  const r=empty();r.attendance=[{representativeId:'x',lokSabha:18,session:'1',presentDays:-1,eligibleDays:3,retrievedAt:'2026-09-20',sourceRefs:[]}];
  assert.equal(validateRecords(r).ok,false);assert.equal(deriveAttendance(r.attendance).percentage,null);
  r.attendance[0].presentDays=4;assert.equal(validateRecords(r).ok,false);
});
test('unintegrated empty parliament remains null, never zero',()=>{
  const totals=deriveParliamentaryTotals(empty(),['digital-sansad-activity']);assert.equal(totals.questions.value,null);assert.equal(totals.questions.availability,'pending');
});
test('MPLADS exact rupees, allocated limit distinct from entitlement and releases',()=>{
  const r=summaryTiles(mplads('summary'));
  assert.equal(r.allocatedLimit,147000000);assert.equal(r.sanctioned,98000000);assert.equal(r.spent,53799122);
  assert.equal('released' in r,false);
});
test('MPLADS real works reconcile, retain verbatim titles and conflicting stages',()=>{
  const p=mplads('recommended','Works Recommended'),r=workRows(p),s=workRows(mplads('sanctioned','Works Sanctioned'));
  const joined=joinWorkReports(r,s,mplads('expenditure'));
  assert.equal(joined.length,67);assert.equal(s.length,46);
  assert.equal(joined.filter(r=>r.statusNote).length,20);
  assert.equal(joined[0].status,undefined);assert.match(joined[0].officialStatus!,/Pending for Sanction/);
  assert.equal(joined[0].officialTitle,r[0].officialTitle);
  assert.equal(joined[0].provenance?.[0].contentHash,p.manifest.contentHash);
  assert.equal(joined.find(r=>r.id==='mplads:294678')?.sanctionDate,undefined);
  assert.equal(joined.find(r=>r.id==='mplads:294678')?.amountSpent,undefined);
});
test('MPLADS malformed reports, duplicate IDs, wrong scope and negative amounts fail',()=>{
  for(const mutate of [(r:any[])=>r.push(r[0]),(r:any[])=>r[0].RECOMMENDED_AMOUNT=-1,(r:any[])=>r[0].CONSTITUENCY_ID=1,(r:any[])=>r[0].WORK_STAGE='Unexpected']) {
    const p=mplads('recommended','Works Recommended'),d=JSON.parse(p.body),r=JSON.parse(d['Total Works Recommended']);mutate(r);d['Total Works Recommended']=JSON.stringify(r);
    assert.throws(()=>workRows({...p,body:JSON.stringify(d)}));
  }
  assert.throws(()=>workRows({...mplads('recommended','Works Recommended'),body:'{}'}));
});
test('strict date and money parsing rejects ambiguous and impossible values',()=>{
  for(const d of ['2026','01/02','2026-02-30','31.02.2026']) assert.throws(()=>date(d));
  assert.equal(date('05-Dec-2025'),'2025-12-05');
  for(const m of ['10 crore','-1','1,2,3','',NaN,Infinity,'900719925474099100']) assert.throws(()=>money(m));
  assert.equal(money('₹14,70,00,000.00'),147000000);assert.equal(money('0.00'),0);
  assert.equal(formatRupees(1234.56),'₹1,234.56');
});
test('lookup rejects broad substrings while retaining demo PIN/locality',()=>{
  assert.equal(lookup('400053').matched,true);assert.equal(lookup('Andheri West, Mumbai').matched,true);
  for(const s of ['a','...','west','Mumbai']) assert.equal(lookup(s).matched,false);
});
test('published snapshots retain byte-verifiable raw provenance',()=>{
  for(const source of ['sansad','mplads'] as const) {
    const p=readPublished(source);assert.ok(p);
    for(const s of p.sources) for(const m of s.manifests??[]) {
      assert.ok(m.storedAt && existsSync(m.storedAt));assert.equal(hashContent(readFileSync(m.storedAt!)),m.contentHash);
    }
  }
});
test('semantic layout does not use global clipping or animated name masks',()=>{
  const layout=readFileSync('app/layout.tsx','utf8'), mp=readFileSync('app/mp/[slug]/page.tsx','utf8');
  assert.doesNotMatch(layout,/overflow-x-clip|overflow-hidden/);
  assert.doesNotMatch(mp, /className="(?:[^"\n]*\s)?(?:reveal|animate-reveal-up)(?:\s|")/);
  assert.doesNotMatch(readFileSync('components/civic/IdentityPlate.tsx','utf8'),/className="[^"\n]*(?:overflow-hidden|whitespace-nowrap)/);
});
