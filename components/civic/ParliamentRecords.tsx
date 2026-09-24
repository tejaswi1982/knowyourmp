import type { ParliamentaryRecords } from '@/types/civic';
import { formatDate } from '@/lib/format';
import { SourceFootnote } from './Evidence';

export function ParliamentRecords({records, only}:{records:ParliamentaryRecords; only?: keyof ParliamentaryRecords}) {
  return <div className="mt-12 space-y-8">
    {(!only || only==='questions') && <details id="questions" className="border-t border-ink/20 pt-5" open={!!only}>
      <summary className="cursor-pointer font-display text-mid">Questions · {records.questions.length} stored records</summary>
      <ol className="mt-6 grid gap-6 md:grid-cols-2">
        {records.questions.map(q=><li key={q.id} data-ministry={q.ministry?.trim() || 'Not supplied'} className="min-w-0 border-t border-ink/20 pt-4">
          <p className="tag text-ink/70">{formatDate(q.date)} · Session {q.session} · {q.questionType} · No. {q.questionNumber}</p>
          <h3 className="mt-3 text-lg font-semibold leading-snug">{q.subject}</h3>
          <p className="mt-2 text-sm">Ministry: {q.ministry}</p>
          {q.questionText && <p className="mt-3 whitespace-pre-line">{q.questionText}</p>}
          {q.answerText && <p className="mt-3 whitespace-pre-line">{q.answerText}</p>}
          {q.answerUrl?<a className="evidence mt-3 inline-block min-h-[44px] py-2 text-cobalt" href={q.answerUrl} target="_blank" rel="noreferrer">Official question and answer ↗</a>:<p className="mt-3 text-sm">Answer document not supplied.</p>}
          <SourceFootnote sourceIds={q.sourceRefs}/>
        </li>)}
      </ol>
    </details>}
    {(!only || only==='interventions') && <details id="interventions" className="border-t border-ink/20 pt-5" open={!!only}>
      <summary className="cursor-pointer font-display text-mid">Debates / interventions · {records.interventions.length} stored records</summary>
      <ol className="mt-6 grid gap-6 md:grid-cols-2">{records.interventions.map(r=><li key={r.id} className="min-w-0 border-t border-ink/20 pt-4">
        <p className="tag text-ink/70">{formatDate(r.date)} · Session {r.session} · {r.debateType}</p>
        <h3 className="mt-3 text-lg font-semibold leading-snug">{r.subject}</h3>
        <a className="evidence mt-3 inline-block min-h-[44px] py-2 text-cobalt" href={r.sourceUrl} target="_blank" rel="noreferrer">Official participation record ↗</a>
        <SourceFootnote sourceIds={r.sourceRefs}/>
      </li>)}</ol>
    </details>}
    {(!only || only==='bills') && <details id="bills" className="border-t border-ink/20 pt-5" open={!!only}>
      <summary className="cursor-pointer font-display text-mid">Private member bills · {records.bills.length} stored introductions</summary>
      <ol className="mt-6 space-y-6">{records.bills.map(r=><li key={r.id} className="border-t border-ink/20 pt-4">
        <p className="tag text-ink/70">{r.introducedDate&&formatDate(r.introducedDate)}</p>
        <h3 className="mt-3 text-lg font-semibold">{r.title}</h3><p className="mt-2 text-sm">{r.status}. Subsequent status has not been independently reconciled.</p>
        <a className="evidence mt-3 inline-block min-h-[44px] py-2 text-cobalt" href={r.sourceUrl} target="_blank" rel="noreferrer">Official introduction record ↗</a>
        <SourceFootnote sourceIds={r.sourceRefs}/>
      </li>)}</ol>
    </details>}
    {(!only || only==='attendance') && <details id="attendance" className="border-t border-ink/20 pt-5" open>
      <summary className="cursor-pointer font-display text-mid">Attendance · session records</summary>
      <p className="mt-4 max-w-read text-sm leading-relaxed">These are attendance-register entries. “Not signed” is not a finding of absence. Fractions appear only for sessions whose dates reconcile; no lifetime percentage is calculated.</p>
      <ol className="mt-6 grid gap-6 md:grid-cols-2">{records.attendance.map(r=><li key={r.session} className="min-w-0 border-t border-ink/20 pt-4">
        <h3 className="font-semibold">Session {r.session}</h3><p className="mt-2 text-sm">Source period: {r.period}</p>
        <p className="mt-3 font-display text-mid">{r.eligibleDays!==undefined?`${r.presentDays} of ${r.eligibleDays} days recorded as signed / attended`:`${r.signedDays} dates recorded as signed / attended`}</p>
        <p className="mt-3 text-sm leading-relaxed">{r.note}</p>
        {!!r.outsideCalendarDates?.length&&<p className="mt-2 text-sm">Dates outside the calendar: {r.outsideCalendarDates.map(formatDate).join('; ')}.</p>}
        <SourceFootnote sourceIds={r.sourceRefs} className="mt-3"/>
      </li>)}</ol>
    </details>}
    {(!only || only==='committees') && <details id="committees" className="border-t border-ink/20 pt-5" open>
      <summary className="cursor-pointer font-display text-mid">Committees · membership terms</summary>
      <ul className="mt-6 space-y-6">{records.committees.map(r=><li key={`${r.name}-${r.since}`}>
        <h3 className="font-semibold">{r.name}</h3><p className="mt-2 text-sm">{r.role} · From {r.since?formatDate(r.since):'date not supplied'} · {r.until?`Until ${formatDate(r.until)}`:'End date not supplied'}</p>
        <SourceFootnote sourceIds={r.sourceRefs??[]} className="mt-3"/>
      </li>)}</ul>
    </details>}
  </div>;
}
