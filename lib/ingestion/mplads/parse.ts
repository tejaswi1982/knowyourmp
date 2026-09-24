import type { ProjectRecord, ProjectStatus } from '@/types/civic';
import type { MpladsPayload } from './types';
import { array, assert, date, integer, money, object, text, unique } from '../validate';
import { REPRESENTATIVE_ID } from '../sansad/parse';

export const PERIOD = '18th Lok Sabha; dashboard as retrieved (reporting cut-off not supplied)';
export const DASHBOARD = 'https://mplads.mospi.gov.in/digigov/dashboard.html';
const STAGES: Record<string, ProjectStatus> = { 'Pending for Sanction':'recommended', 'Sanction':'sanctioned', 'Vendor Identification':'sanctioned', 'Time Estimation':'sanctioned', 'Work partially Completed':'in-progress' };

/** The portal wraps its report rows as JSON inside JSON and appends a total. */
export function reportRows(p: MpladsPayload, key: string) {
  assert(p.mpladsMemberId === '3042793' && p.constituencyCode === '270', 'Unverified MPLADS join');
  const rows = array(JSON.parse(text(object(JSON.parse(p.body))[key]))).map(object);
  assert(rows.length>0 && Object.keys(rows.at(-1)!).length===1 && 'Total_Amt' in rows.at(-1)!, 'Missing report total row');
  const total = money(rows.pop()!.Total_Amt);
  for (const r of rows) {
    assert(r.HOUSE_OF_PARLIAMENT===2 && r.TENURE==='18th Lok Sabha' && r.CONSTITUENCY==='MUMBAI NORTH WEST' && r.MP_NAME==='RAVINDRA DATTARAM WAIKAR', 'Report scope mismatch');
    if (r.CONSTITUENCY_ID!==undefined) assert(r.CONSTITUENCY_ID===270,'Wrong constituency');
  }
  return { rows, total };
}
export function workRows(p: MpladsPayload): ProjectRecord[] {
  const recommended = p.reportKey === 'Works Recommended';
  const { rows, total } = reportRows(p, recommended ? 'Total Works Recommended' : 'Total Sanction Work');
  const records = rows.map(r => {
    const officialStatus = text(r.WORK_STAGE);
    assert(officialStatus in STAGES, `Unrecognised work stage: ${officialStatus}`);
    return { id:`mplads:${integer(r.WORK_RECOMMENDATION_DTL_ID)}`, representativeId:REPRESENTATIVE_ID, officialTitle:text(r.ACTIVITY_NAME), description:text(r.WORK_DESCRIPTION), category:text(r.WORK_CATEGORY), officialStatus, status:STAGES[officialStatus], districtAuthority:text(r.IDA_NAME), amountRecommended:recommended?money(r.RECOMMENDED_AMOUNT):undefined, amountSanctioned:recommended?undefined:money(r.SANCTION_AMOUNT), recommendationDate:date(r.RECOMMENDATION_DATE), sanctionDate:r.SANCTION_DATE && r.SANCTION_DATE!=="NA"?date(r.SANCTION_DATE):undefined, availability:'published' as const, reportingPeriod:PERIOD, sourceUrl:DASHBOARD, sourceRefs:[recommended?'mplads-recommended':'mplads-sanctioned'], provenance:[p.manifest] };
  });
  const sum = records.reduce((s,r)=>s+Math.round((recommended?r.amountRecommended!:r.amountSanctioned!)*100),0)/100;
  assert(sum===total, 'Work amounts do not reconcile with report total');
  return unique(records,r=>r.id);
}
export function summaryTiles(p: MpladsPayload) {
  assert(p.mpladsMemberId==='3042793','Unverified MPLADS member');
  const d = object(JSON.parse(p.body));
  const allocated = array(d["Allocated Limit for Hon'ble MPs"]), spent = array(d['Expenditure on Completed and On-going Works as on Date']);
  const recommended = array(d['Works Recommended']), sanctioned = array(d['Works Sanctioned']);
  assert(object(array(d['Current Tenure'])[0]).ID===7,'MPLADS term mismatch');
  return { allocatedLimit:money(allocated[0]), spent:money(spent[0]), recommended:money(recommended[1]), sanctioned:money(sanctioned[1]), recommendedCount:integer(recommended[0]), sanctionedCount:integer(sanctioned[0]), reportLabel:PERIOD };
}
export function joinWorkReports(recommended: ProjectRecord[], sanctioned: ProjectRecord[], expenditure: MpladsPayload): ProjectRecord[] {
  const {rows,total} = reportRows(expenditure,'Total Expenditure');
  const sum = rows.reduce((s,r)=>s+Math.round(money(r.FUND_DISBURSED_AMT)*100),0)/100;
  assert(sum===total,'Expenditure rows do not reconcile');
  const sanctions = new Map(sanctioned.map(r=>[r.id,r]));
  const ids = new Set(recommended.map(r=>r.id));
  for (const s of sanctioned) assert(ids.has(s.id),'Sanctioned work missing from recommendations');
  for (const r of rows) assert(ids.has(`mplads:${integer(r.WORK_RECOMMENDATION_DTL_ID)}`),'Expenditure has unknown work ID');
  return recommended.map(r=> {
    const s = sanctions.get(r.id), payments = rows.filter(p=>`mplads:${p.WORK_RECOMMENDATION_DTL_ID}`===r.id);
    if (s) assert(s.description===r.description && s.officialTitle===r.officialTitle, 'Conflicting work text across reports');
    const stagesConflict = s && s.officialStatus!==r.officialStatus;
    return { ...r, amountSanctioned:s?.amountSanctioned, status:stagesConflict?undefined:s?.status??r.status, officialStatus:stagesConflict?`Recommendations report: ${r.officialStatus}; sanctions report: ${s.officialStatus}`:s?.officialStatus??r.officialStatus, statusNote:stagesConflict?'The two official reports disagree on the work stage. Both labels are retained.':undefined, amountSpent:payments.length?payments.reduce((a,p)=>a+Math.round(money(p.FUND_DISBURSED_AMT)*100),0)/100:undefined, implementingAgency:payments.length?[...new Set(payments.map(p=>text(p.IA_NAME)))].join(' · '):undefined, sourceRefs:[...new Set([...r.sourceRefs,...s?.sourceRefs??[],...(payments.length?['mplads-expenditure']:[])])], provenance:[...r.provenance??[],...s?.provenance??[],...(payments.length?[expenditure.manifest]:[])] };
  });
}
