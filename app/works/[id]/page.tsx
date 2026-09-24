/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWork } from '@/lib/works';
import { getProfile } from '@/lib/repository';
import { formatDate, formatRupees } from '@/lib/format';
import { published, responses } from '@/lib/contributions/store';
import { SourcePeek } from '@/components/civic/StoryInteractions';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id);
  return { title: work ? `Work ${id} · Mumbai North-West` : 'Work not found' };
}
export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await getWork(id); if (!work) notFound();
  const profile = await getProfile('mumbai-north-west');
  const evidence = published(id); const observations = evidence.filter(c => c.kind === 'observation'); const documents = evidence.filter(c => c.kind === 'document');
  const authority = responses(id);
  const sources = profile?.sources.filter(s => work.sourceRefs.includes(s.id)) ?? [];
  const money = (n?: number) => n == null ? 'Not supplied' : formatRupees(n);
  const dates = (d?: string) => d ? formatDate(d) : 'Not supplied';
  const groups = [...new Set(observations.map(c => c.observationType))].map(type => ({ type, count: observations.filter(c => c.observationType === type).length }));
  const latest = observations.map(c => c.observationDate).sort().at(-1);
  const events = [
    ...(work.recommendationDate ? [{ date: work.recommendationDate, label: 'Official record · Work recommended' }] : []),
    ...(work.sanctionDate ? [{ date: work.sanctionDate, label: 'Official record · Work sanctioned' }] : []),
    ...(work.completionDate ? [{ date: work.completionDate, label: 'Official record · Completion date' }] : []),
    ...evidence.map(c => ({ date: c.submittedAt.slice(0,10), label: c.kind === 'observation' ? `Citizen submission · ${c.observationType}` : `Supporting source submitted · ${c.field}` })),
  ].sort((a,b) => a.date.localeCompare(b.date));
  return <div className="civic-page"><Link className="civic-back" href="/works">← All public works</Link><header className="civic-hero"><p className="civic-kicker">Mumbai North-West · Work {id}</p><h1 className="civic-work-title">{work.description ?? work.officialTitle}</h1><p>A public record that can grow with evidence.</p><Link className="civic-action" href={`/works/${id}/verify`}>Verify this work →</Link><nav className="civic-record-nav" aria-label="On this record"><a href="#official">Official record ↓</a><a href="#citizen-checks">Citizen checks ↓</a><a href="#sources">Sources ↓</a></nav></header>
    <section className="civic-section" id="official"><h2 className="civic-kicker">Official record</h2><p className="civic-muted">MPLADS / Ministry of Statistics and Programme Implementation</p><dl className="civic-facts">
      {[['Official title', work.officialTitle], ['Location', work.locationText ?? 'No structured location supplied. Refer to the official description above.'], ['Amount recommended', money(work.amountRecommended)], ['Amount sanctioned', money(work.amountSanctioned)], ['Expenditure recorded', money(work.amountSpent)], ['Official category', work.category ?? 'Not supplied'], ['Implementing agency', work.implementingAgency ?? 'Not supplied'], ['District authority', work.districtAuthority ?? 'Not supplied'], ['Recommended date', dates(work.recommendationDate)], ['Sanctioned date', dates(work.sanctionDate)], ['Completion date', dates(work.completionDate)], ['Reporting period', work.reportingPeriod ?? 'Not supplied']].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl><div className="civic-status"><h3>Official status</h3>{(work.officialStatus ?? 'Not supplied').split('; ').map(s => <p key={s}>{s}</p>)}{work.statusNote && <p className="civic-muted">The retrieved official reports do not agree on the current stage. Both records are shown.</p>}</div><a href="#sources">Inspect official sources ↓</a></section>
    <section className="civic-section civic-invitation"><p className="civic-kicker">Citizen check</p><h2>Can you verify this work?</h2><p>Help document what this project looks like on the ground.</p><Link className="civic-action" href={`/works/${id}/verify`}>Start citizen check →</Link><p className="civic-muted">About 2 to 5 minutes. Reviewed before publication. No GPS required.</p></section>
    <section className="civic-section" id="citizen-checks"><h2 className="civic-kicker">Citizen checks</h2><h3>{observations.length ? `${observations.length} published observation${observations.length === 1 ? '' : 's'}` : 'No published observations yet'}</h3><p className="civic-muted">Citizen-submitted evidence. Moderation does not independently establish the condition of the work. Official records remain separate.</p>{latest && <p>Last checked {dates(latest)}</p>}{groups.map(g => <p key={g.type}><strong>{g.count}</strong> · {g.type}</p>)}
      {observations.map(c => <article className="civic-evidence" key={c.id}><h3>{c.observationType}</h3><p>{dates(c.observationDate)} · {c.contributorLabel}</p><p className="civic-muted">{c.approximateLocation} · self-reported, no GPS collected</p><div className="civic-photos">{c.photoIds.map(id => <figure key={id}><img src={`/api/contributions/media/${id}`} alt={`Citizen photograph documenting: ${c.observationType}`} loading="lazy"/><figcaption>Citizen-submitted photograph</figcaption></figure>)}</div>{c.note && <p>{c.note}</p>}</article>)}
    </section>
    <section className="civic-section"><p className="civic-kicker">Help complete this record</p><h2>A source could fill a gap.</h2><p>Missing from this record: {[!work.locationText && 'structured location', !work.completionDate && 'completion date', work.amountSpent == null && 'expenditure', 'contractor', 'work order'].filter(Boolean).join(', ')}.</p><Link className="civic-action" href={`/works/${id}/documents`}>Submit a document or source →</Link><p className="civic-muted">Approved sources appear separately. They do not change official fields.</p></section>
    {!!documents.length && <section className="civic-section"><h2 className="civic-kicker">Supporting documents</h2>{documents.map(c => <article className="civic-evidence" key={c.id}><h3>{c.field}</h3><p>Source document submitted by citizen · {dates(c.observationDate)}</p><p>{c.note}</p><p className="civic-muted">Source checked by a moderator; not an amendment to the official record.</p>{c.sourceUrl && <p><a href={c.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">View submitted source ↗</a></p>}{c.photoIds.map(id => <p key={id}><a href={`/api/contributions/media/${id}`} target="_blank" rel="noreferrer">Open supporting attachment ↗</a></p>)}</article>)}</section>}
    {!!authority.length && <section className="civic-section"><h2 className="civic-kicker">Authority / representative response</h2>{authority.map(r => <article key={r.id}><h3>{r.respondingOrganisation}</h3><p>{dates(r.responseDate)} · Respondent identity verified</p><p>{r.responseText}</p>{r.supportingDocumentUrl && <a href={r.supportingDocumentUrl}>Supporting document ↗</a>}</article>)}</section>}
    <section className="civic-section" id="sources"><h2 className="civic-kicker">Sources</h2><p>Official dashboard reports · retrieved {dates(work.provenance?.[0]?.retrievedAt)}</p><SourcePeek sources={sources} context={`Official sources for work ${id}`}/><p className="civic-muted">The portal is not a work-specific link. Select Maharashtra → Mumbai North West → Ravindra Dattaram Waikar → 18th Lok Sabha, then the named report.</p><Link href="/mp/mumbai-north-west/records?view=sources">Source register, request details & hashes ↗</Link><p>Citizen photographs, notes and supporting documents above are separately labelled.</p></section>
    <details className="civic-section"><summary>Record history</summary><ol className="civic-history">{events.map((e,i) => <li key={i}><time dateTime={e.date}>{dates(e.date)}</time><span>{e.label}</span></li>)}</ol><p className="civic-muted">Only dated official events and published submissions are shown. A submission date is not a project completion date.</p></details>
  </div>;
}
