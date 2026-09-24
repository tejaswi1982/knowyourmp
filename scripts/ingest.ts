import { fetchSansad, PARSER_VERSION as SV, SESSION_ENDPOINT } from '../lib/ingestion/sansad/client';
import { questionPage, debatePage, billPage, attendanceRecord, committeeRecords, REPRESENTATIVE_ID } from '../lib/ingestion/sansad/parse';
import { fetchMplads, PARSER_VERSION as MV } from '../lib/ingestion/mplads/client';
import { summaryTiles, workRows, joinWorkReports, reportRows, DASHBOARD, PERIOD } from '../lib/ingestion/mplads/parse';
import { toFundSummary } from '../lib/ingestion/mplads/normalise';
import { fetchSnapshot, ValidationError } from '../lib/ingestion/core';
import { array, assert, integer, object, text, unique } from '../lib/ingestion/validate';
import { publish, readPublished, writeState } from '../lib/ingestion/storage';
import { validateRecords } from '../lib/ingestion/sansad/normalise';
import { funds as seedFunds, representative } from '../data/mps/ravindra-waikar';
import type { NormalizedSnapshot, SourceReference, SnapshotManifest, ParliamentaryRecords } from '../types/civic';

const [source,...args] = process.argv.slice(2);
assert(source==='sansad'||source==='mplads','Specify sansad or mplads');
const dryRun = args.includes('--dry-run');
const mi = args.indexOf('--member');
const member = mi>=0?args[mi+1]:'5701';
assert(member==='5701','Only verified member 5701 is supported');
assert(args.every((a,i)=>a==='--dry-run'||a==='--member'||(mi>=0 && i===mi+1)),'Unknown argument');
const attemptedAt = new Date().toISOString();
const sources: SourceReference[] = [];
const warnings: string[] = [];
function citation(id:string,title:string,manifests:SnapshotManifest[],note?:string):void {
  assert(manifests.length>0,'No snapshots');
  sources.push({id,title,url:source==='sansad'?manifests[0].sourceUrl:DASHBOARD,publisher:source==='sansad'?'Digital Sansad, Lok Sabha Secretariat':'Ministry of Statistics and Programme Implementation',code:source==='sansad'?'Digital Sansad':'MPLADS',official:true,docRef:title,period:source==='sansad'?'18th Lok Sabha':PERIOD,retrievedAt:manifests[0].retrievedAt,parserVersion:source==='sansad'?SV:MV,deepLinkStatus:source==='sansad'?'exact':'pending',note:note??(source==='mplads'?'Select Maharashtra → Mumbai North West → Ravindra Dattaram Waikar → 18th Lok Sabha on the dashboard. Member 3042793; reporting cut-off is not supplied.':undefined),manifests});
}
async function parliament():Promise<NormalizedSnapshot> {
  const profile = await fetchSansad({dataset:'memberProfile',sansadMemberId:member});
  const identity = object(JSON.parse(profile.body));
  assert(integer(identity.mpsno)===5701 && identity.firstLastName===representative.fullName && identity.partyFname===representative.party && identity.constituency==='Mumbai North West', 'Official identity conflicts with seed. Review before replacing.');
  citation('sansad-memberProfile','Member 5701 biography',[profile.manifest], 'Official spelling is Mumbai North West. The seed retains Mumbai North-West. The biography is not the nomination affidavit.');
  const records:ParliamentaryRecords = {questions:[],interventions:[],bills:[],attendance:[],committees:[]};
  for (const dataset of ['questions','debates','bills'] as const) {
    const manifests:SnapshotManifest[]=[];
    let expected:number|undefined;
    const output:typeof records.questions|typeof records.interventions|typeof records.bills = [];
    for (let page=1;page<=1000;page++) {
      const payload = await fetchSansad({dataset,sansadMemberId:member,page});
      manifests.push(payload.manifest);
      const parsed = dataset==='questions'?questionPage(payload):dataset==='debates'?debatePage(payload):billPage(payload);
      if(expected===undefined) expected=parsed.total;
      assert(expected===parsed.total,'Source total changed during pagination');
      (output as unknown[]).push(...parsed.records);
      if(output.length>=expected) break;
      assert(parsed.records.length>0,'Unexpected empty page');
    }
    assert(output.length===expected,'Incomplete dataset');
    unique(output as {id:string}[],r=>r.id);
    if(dataset==='questions') records.questions=output as typeof records.questions;
    if(dataset==='debates') records.interventions=output as typeof records.interventions;
    if(dataset==='bills') records.bills=output as typeof records.bills;
    citation(`sansad-${dataset}`,dataset==='bills'?'Private bill introductions':dataset==='debates'?'Member participation records':'Member questions',manifests);
  }
  const committees = await fetchSansad({dataset:'committees',sansadMemberId:member});
  records.committees = committeeRecords(committees);
  citation('sansad-committees','Committee membership terms',[committees.manifest]);
  const calendar = await fetchSnapshot({source:'sansad',url:SESSION_ENDPOINT.replace('{memberId}',member),parserVersion:SV,key:'sessions-5701',sourceIdentifier:member});
  const term = array(JSON.parse(calendar.body)).map(object).find(r=>r.loksabha===18);
  assert(term,'No 18th Lok Sabha sessions');
  const attendanceManifests = [calendar.manifest];
  for(const item of array(term.sessions)) {
    const s=object(item), session=String(integer(s.sessionNo));
    const payload=await fetchSansad({dataset:'attendance',sansadMemberId:member,session});
    records.attendance.push(attendanceRecord({...payload,session,sessionDates:array(s.dates).map(text),period:array(s.sessionPeriod).map(text).join('; '),calendarManifest:calendar.manifest}));
    attendanceManifests.push(payload.manifest);
  }
  citation('sansad-attendance','Session calendars and attendance entries',attendanceManifests);
  // No aggregate percentage: excluded sessions and differing update coverage
  // are explicit, while each reconciled session retains its own fraction.
  for(const r of records.attendance) if(r.eligibleDays===undefined) warnings.push(`Session ${r.session}: ${r.note}`);
  const questionSessions=new Set(records.questions.map(r=>r.session));
  for(const s of questionSessions) if(!records.attendance.some(r=>r.session===s)) warnings.push(`Questions include session ${s}; attendance calendar does not. No lifetime attendance calculated.`);
  const outcome=validateRecords(records,readPublished('sansad')?.records);
  assert(outcome.ok && outcome.warnings.length===0,[...outcome.blocking,...outcome.warnings].join('; '));
  return {version:1,representativeId:REPRESENTATIVE_ID,sourceIdentifier:member,retrievedAt:attemptedAt,state:{status:warnings.length?'partial':'ready',attemptedAt,lastSuccessAt:attemptedAt,message:'Official records saved; coverage and date conflicts are disclosed.',warnings},sources,records,complete:{questions:true,interventions:true,bills:true,committees:true,attendance:false}};
}
async function mplads():Promise<NormalizedSnapshot> {
  // Verify the ID chain afresh, never substitute a same-name member.
  for(const [endpoint,body,check] of [
    ['getStateData',{},(v:unknown)=>array(v).some(r=>object(r).STATE_ID===21&&object(r).STATE_NAME==='Maharashtra')],
    ['getTenureData',{uname:'0,0,0,2'},(v:unknown)=>array(v).some(r=>object(r).ID===7&&object(r).CAPTION==='18th Lok Sabha')],
    ['getConstituencyData',{id:'21'},(v:unknown)=>array(v).some(r=>object(r).ID===270&&object(r).CAPTION==='MUMBAI NORTH WEST')],
    ['getMpAndConstCombo',{const_combo:'270,2,7'},(v:unknown)=>array(v).length===1&&object(array(v)[0]).ID===3042793&&object(array(v)[0]).CAPTION==='RAVINDRA DATTARAM WAIKAR'],
  ] as const) {
    const p=await fetchSnapshot({source:'mplads',url:`https://mplads.mospi.gov.in/rest/PreLoginDashboardData/${endpoint}`,parserVersion:MV,key:`identity-${endpoint}`,sourceIdentifier:'3042793',init:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}});
    assert(check(JSON.parse(p.body)),'MPLADS identity chain changed');
    citation(`mplads-${endpoint}`,`Member mapping: ${endpoint}`,[p.manifest]);
  }
  const options={mpladsMemberId:'3042793',constituencyCode:'270'};
  const summary=await fetchMplads({...options,dataset:'summary'}), raw=summaryTiles(summary);
  citation('mplads-summary','Financial summary',[summary.manifest]);
  const recommended=await fetchMplads({...options,dataset:'works',reportKey:'Works Recommended'});
  const sanctioned=await fetchMplads({...options,dataset:'works',reportKey:'Works Sanctioned'});
  const expenditure=await fetchMplads({...options,dataset:'expenditure',reportKey:'Expenditure on Completed and On-going Works as on Date'});
  citation('mplads-recommended','Works recommended',[recommended.manifest]);
  citation('mplads-sanctioned','Works sanctioned',[sanctioned.manifest]);
  citation('mplads-expenditure','Reported expenditure transactions',[expenditure.manifest]);
  const r=workRows(recommended), s=workRows(sanctioned);
  assert(r.length===raw.recommendedCount&&s.length===raw.sanctionedCount,'Tile/work count mismatch');
  assert(reportRows(recommended,'Total Works Recommended').total===raw.recommended&&reportRows(sanctioned,'Total Sanction Work').total===raw.sanctioned&&reportRows(expenditure,'Total Expenditure').total===raw.spent,'Financial summaries do not reconcile');
  const projects=joinWorkReports(r,s,expenditure);
  const previous=readPublished('mplads');
  assert(!previous?.projects?.length || projects.length>=previous.projects.length,'Work count fell; review before publishing');
  for(const p of projects) if(p.statusNote) warnings.push(`${p.id}: ${p.statusNote}`);
  warnings.push('The report does not supply a reporting cut-off, release amount, balance or utilization percentage.');
  const funds=toFundSummary({representativeId:REPRESENTATIVE_ID,raw,entitlement:seedFunds.entitlement,period:PERIOD,schemeNotes:seedFunds.schemeNotes,sourceRefs:['mplads-summary']});
  for(const metric of [funds.released,funds.balance]) if(metric) metric.availability='no-data';
  funds.sourceRefs.push('mplads-guidelines');
  return {version:1,representativeId:REPRESENTATIVE_ID,sourceIdentifier:'3042793',retrievedAt:attemptedAt,state:{status:'partial',attemptedAt,lastSuccessAt:attemptedAt,message:'Official dashboard reports ingested; missing fields and conflicting work stages are disclosed.',warnings},sources,funds,projects};
}
async function main() {
  try {
    const result=source==='sansad'?await parliament():await mplads();
    if(!dryRun) await publish(source as 'sansad'|'mplads',result);
    console.log(JSON.stringify({source,dryRun,published:!dryRun,records:result.records?Object.fromEntries(Object.entries(result.records).map(([k,v])=>[k,v.length])):{works:result.projects?.length},warnings:result.state.warnings},null,2));
  } catch(error) {
    const message=error instanceof Error?error.message:String(error);
    if(!dryRun) await writeState(source as 'sansad'|'mplads',{status:error instanceof ValidationError?'parser-mismatch':'source-unavailable',attemptedAt,lastSuccessAt:readPublished(source as 'sansad'|'mplads')?.retrievedAt,message,warnings:[message]});
    console.error(message); process.exitCode=1;
  }
}
void main();
