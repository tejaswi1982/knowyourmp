import type { AttendanceSessionRecord, CommitteeMembership, ParliamentIntervention, ParliamentQuestion, PrivateMemberBillRecord } from '@/types/civic';
import type { SansadPayload } from './types';
import { array, assert, date, integer, object, officialUrl, text, unique } from '../validate';

export const REPRESENTATIVE_ID = 'ls18-mh-mumbai-north-west';
function context(p: SansadPayload) {
  assert(p.sansadMemberId === '5701', 'Member mapping not verified');
  officialUrl(p.manifest.sourceUrl);
  return { representativeId: REPRESENTATIVE_ID, sourceRefs: [`sansad-${p.dataset}`], provenance: p.manifest, sourceUrl: p.manifest.sourceUrl };
}
export function questionPage(p: SansadPayload): { total: number; records: ParliamentQuestion[] } {
  const base = context(p), envelope = array(JSON.parse(p.body));
  assert(envelope.length === 1, 'Question envelope changed');
  const data = object(envelope[0]);
  const records = array(data.listOfQuestions).map(value => {
    const q = object(value), lokSabha = integer(q.lokNo), session = String(integer(q.sessionNo));
    assert(lokSabha === 18, 'Wrong Lok Sabha');
    const type = text(q.type).toLowerCase();
    assert(['starred','unstarred'].includes(type), `Unsupported question type ${type}`);
    const questionNumber = String(integer(q.quesNo)), when = date(q.date);
    assert(array(q.member).includes('Shri Ravindra Dattaram Waikar'), 'Member-filter result mismatch');
    return { ...base, id: `ls18:q:${session}:${type}:${questionNumber}:${when}`, lokSabha, session, date: when, questionNumber, questionType: type as 'starred'|'unstarred', subject: text(q.subjects), ministry: text(q.ministry), answerUrl: q.questionsFilePath ? officialUrl(q.questionsFilePath) : undefined, questionText: q.questionText ? text(q.questionText) : undefined, answerText: q.answerText ? text(q.answerText) : undefined };
  });
  return { total: integer(data.totalRecordSize), records: unique(records, r=>r.id) };
}
export function debatePage(p: SansadPayload): { total: number; records: ParliamentIntervention[]; rows: Record<string, unknown>[] } {
  const base = context(p), data = object(JSON.parse(p.body));
  const rows = array(data.records).map(object);
  const records = rows.map(r => {
    assert(integer(r.loksabha) === 18, 'Wrong Lok Sabha');
    assert(array(r.mpPartDetailList).some(v=>integer(object(v).mpCode)===5701), 'Member is not a listed participant');
    const session = String(integer(r.session)), id = integer(r.dbSlno);
    return { ...base, id: `ls18:debate:${session}:${id}`, lokSabha: 18, session, date: date(r.debateDate), subject: text(r.debateTitle), debateType: text(r.debateTypeDesc), sourceUrl: `https://sansad.in/ls/debates/view-debate?ls=18&session=${session}&dbslno=${id}` };
  });
  return { total: integer(object(data._metadata).totalElements), records: unique(records,r=>r.id), rows };
}
export function billPage(p: SansadPayload): { total: number; records: PrivateMemberBillRecord[] } {
  const base = context(p), result = debatePage(p);
  const records = result.rows.map((r,i) => {
    // The official private-bill tab is a participation listing. Only explicit
    // introductions with a sole listed member are safe to count as introduced.
    assert(integer(r.debateType)===39 && /-\s*Introduced\s*$/i.test(text(r.debateTitle)), 'Private bill participation is not an introduction');
    assert(array(r.mpPartDetailList).length===1, 'Introducing member is ambiguous');
    return { ...base, id: result.records[i].id.replace(':debate:',':bill:'), title: text(r.debateTitle), introducedDate: result.records[i].date, status: 'Introduced (as recorded in the cited debate)', sourceUrl: result.records[i].sourceUrl };
  });
  return { total: result.total, records };
}
export function committeeRecords(p: SansadPayload): CommitteeMembership[] {
  const base = context(p), data = object(JSON.parse(p.body));
  const records = array(data.committeeMembershipDtoList).map(v=> {
    const r = object(v); assert(integer(r.lokSabha)===18, 'Wrong committee term');
    return { ...base, name: text(r.committeeName), role: text(r.status), since: date(r.dateFrom), until: r.dateTo ? date(r.dateTo) : undefined, availability: 'published' as const };
  });
  assert(records.length===integer(object(data.metaDataDto).totalElements), 'Incomplete committee listing');
  return unique(records,r=>`${r.name}:${r.since}:${r.until}`);
}
export function attendanceRecord(p: SansadPayload): AttendanceSessionRecord {
  const base = context(p);
  assert(p.session && p.sessionDates && p.calendarManifest, 'Attendance requires session calendar');
  const statuses = new Map<string,string>();
  for (const value of array(JSON.parse(p.body))) {
    const r = object(value), status = text(r.attendanceType);
    assert(['S','S*','S#','NS@','NS','NR'].includes(status), 'Unknown attendance status');
    for (const value of array(r.dates)) { const d = date(value); assert(!statuses.has(d),'Duplicate attendance date'); statuses.set(d,status); }
  }
  const calendar = new Set(p.sessionDates.map(date));
  assert(calendar.size===p.sessionDates.length, 'Duplicate sitting date');
  const outsideCalendarDates = [...statuses.keys()].filter(d=>!calendar.has(d));
  const missing = [...calendar].filter(d=>!statuses.has(d));
  const signed = [...statuses.values()].filter(s=>['S','S*','S#','NS@'].includes(s)).length;
  // NS means not signed; do not infer absence. Missing or extra dates invalidate
  // the denominator. Retain the session and explain the mismatch instead.
  const usable = statuses.size>0 && !outsideCalendarDates.length && !missing.length;
  const eligible = usable ? [...statuses.values()].filter(s=>s!=='NR').length : undefined;
  return { ...base, lokSabha:18, session:p.session, period:p.period, signedDays:signed, calendarDays:calendar.size, missingDays:missing.length, outsideCalendarDates, presentDays:usable?signed:undefined, eligibleDays:eligible, retrievedAt:p.manifest.retrievedAt, note:usable ? 'Signed (register/mobile) or explicitly recorded as attended but not signed. NS is not signed, not an inferred absence.' : `Session dates do not reconcile: ${missing.length} calendar dates without entries; ${outsideCalendarDates.length} attendance dates outside the calendar. Percentage withheld.` };
}
