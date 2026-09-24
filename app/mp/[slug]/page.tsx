import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProfile, listProfileSlugs } from '@/lib/repository';
import { formatRupees, splitRupees } from '@/lib/format';
import { questionMinistries } from '@/lib/mp-story';
import { SourcePeek, PlaceMarker } from '@/components/civic/StoryInteractions';
import { StoryImage } from '@/components/civic/StoryImage';
import { FollowArea } from '@/components/civic/Participation';
import type { IngestionState, SourceReference } from '@/types/civic';
export const dynamic = 'force-dynamic';
type PageProps = { params: Promise<{ slug: string }>; searchParams?: Promise<{ pin?: string }> };
export async function generateStaticParams() { return (await listProfileSlugs()).map(slug => ({ slug })); }
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);
  return profile ? { title: `${profile.representative.fullName}: ${profile.constituency.name}`, description: 'Where you live. Who represents you. The public record, Parliament and public money, with sources.', alternates: { canonical: `/mp/${slug}` }, openGraph: { url: `/mp/${slug}` } } : { title: 'Constituency not found' };
}

function Amount({ value }: { value: number | null | undefined }) {
  if(value==null)return <>Not supplied</>;
  const parts=splitRupees(value);
  return <><span className="amount-main">₹{parts.amount}</span>{parts.unit&&<span className="amount-unit">{parts.unit}</span>}</>;
}
function UpdateFlag({state}:{state?:IngestionState}) {
  if(!state?.lastSuccessAt)return <p className="moment-note">Data not yet available.</p>;
  const failed=['parser-mismatch','source-unavailable'].includes(state.status);
  const stale=Date.now()-Date.parse(state.lastSuccessAt)>30*86400000;
  return failed||stale ? <p className="moment-note">{failed?'Update unavailable. Showing the last saved record.':'Saved record is over 30 days old.'}</p> : null;
}

export default async function RepresentativePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getProfile(slug);
  if (!profile) notFound();
  const { representative: mp, constituency: seat, affidavit, parliamentary, parliamentaryRecords: records, funds, projects, sources } = profile;
  const activePin = query?.pin && seat.samplePins.includes(query.pin) ? query.pin : seat.samplePins[0];
  const activeLocality = seat.pinLocalities?.[activePin] ?? seat.name;
  const base=`/mp/${slug}/records`;
  const ministries=questionMinistries(records.questions);
  const pick=(ids:string[])=>sources.filter(s=>ids.includes(s.id)).map(({manifests: _manifests,...source})=>source);
  const peek=(ids:string[],context:string,caveat?:string)=><SourcePeek sources={pick(ids)} context={context} caveat={caveat}/>;
  const ready=!!profile.ingestion?.sansad?.lastSuccessAt;
  const moneyReady=!!profile.ingestion?.mplads?.lastSuccessAt;
  const moneySources=(value: {sourceRefs:string[]} | undefined)=>value?.sourceRefs??[];
  const family=(id:string,fallback:string):SourceReference|undefined=>sources.find(s=>s.id===id)??sources.find(s=>s.id===fallback);
  return <div className="scroll-story">
    <Link href="/" className="quiet-brand" aria-label="KnowYourMP home">KnowYourMP</Link>
    <PlaceMarker pin={activePin} code={seat.code}/>

    <section className="moment moment-place" id="place" aria-labelledby="place-title">
      <div className="moment-core">
        <StoryImage moment="place"/>
        <h1 id="place-title" className="place-pin fact-giant">{activePin}</h1>
        <p className="place-name">{activeLocality}</p>
        <p className="place-seat-name">{seat.name}</p>
        {peek(seat.lookupMetadata.sourceRefs,'Place and constituency',seat.lookupMetadata.caveat)}
        <FollowArea pin={activePin}/>
      </div>
      <span className="scroll-hint" aria-hidden="true">↓</span>
    </section>

    <section className="moment moment-person" id="representative" aria-labelledby="mp-name">
      <div className="moment-core">
        <h2 id="mp-name" className="person-name factual-name">{mp.fullName.split(' ').map((word,i)=><span key={i}>{word}</span>)}</h2>
        <p className="moment-label">Your MP</p><p className="person-seat">{seat.name}</p><p className="person-party">{mp.party}</p>
        <details className="tap-reveal identity-reveal"><summary>see record <span aria-hidden="true">↓</span></summary><div className="reveal-body">
          <p>{mp.term.label} · Elected {mp.term.startYear}</p><p>{activeLocality} is one of {seat.assemblySegments.length} assembly segments in this seat.</p>
          <p>{seat.assemblySegments.join(' · ')}</p>
          {peek(mp.sourceRefs,'Representative identity')}
        </div></details>
      </div>
    </section>

    <section className="moment moment-assets" id="public-record" aria-labelledby="assets-label">
      <div className="moment-core">
        <p className="fact-money"><Amount value={affidavit?.assets.value}/></p>
        <h2 id="assets-label" className="moment-label">declared assets</h2>
        <div className="fact-caption"><span>{affidavit?.assets.value!=null?formatRupees(affidavit.assets.value):'Not available'}{affidavit?` · ${affidavit.electionYear} affidavit`:''}</span>{peek(affidavit?.assets.sourceRefs??[],'Declared assets','As declared at nomination. The inherited affidavit values are preserved; exact-document re-verification remains outstanding.')}</div>
        <details className="tap-reveal affidavit-reveal"><summary>what else was declared? <span aria-hidden="true">↓</span></summary><div className="reveal-body">
          {affidavit ? <>
            <div className="revealed-fact"><p className="reveal-money"><Amount value={affidavit.liabilities.value}/></p><h3>declared liabilities</h3><p className="exact-caption">{affidavit.liabilities.value!==null?formatRupees(affidavit.liabilities.value):'Not available'}</p></div>
            <div className="revealed-fact"><p className="reveal-number">{affidavit.criminalCases.declaredCount??'Not available'}</p><h3>declared criminal cases</h3><p className="legal-caption">{affidavit.criminalCases.legalNote}</p></div>
            <div className="revealed-fact"><p className="reveal-education">{affidavit.education.value??'Not available'}</p><h3>education, as declared</h3><p>{affidavit.educationDetail}</p></div>
            <Link className="investigate-link" href={`${base}?view=affidavit`}>view affidavit record & source ↗</Link>
          </> : <p>Affidavit data is not available.</p>}
        </div></details>
      </div>
    </section>

    <section className="moment moment-questions" id="parliament" aria-labelledby="questions-label">
      <div className="moment-core">
        <StoryImage moment="parliament"/>
        <p className="fact-giant question-number">{parliamentary?.questions.value??'Not available'}</p>
        <h2 id="questions-label" className="moment-label">questions in Parliament</h2>
        <div className="fact-caption"><span>{mp.term.label}</span>{peek(parliamentary?.questions.sourceRefs??[],'Questions in Parliament','Member 5701. Each stored question is counted once, including jointly tabled questions. The ministry labels are the source’s own labels, not inferred themes.')}</div>
        <UpdateFlag state={profile.ingestion?.sansad}/>
        <details className="tap-reveal parliament-reveal"><summary>what did he ask about? <span aria-hidden="true">↓</span></summary><div className="reveal-body">
          <p className="reveal-note">Questions grouped by the ministry named in the official record. Tap a ministry to read its questions.</p>
          <ul className="ministry-list">{ministries.map(group=><li key={group.label}><Link href={`${base}?view=questions&ministry=${encodeURIComponent(group.label)}`}><span>{group.label}</span><strong>{group.count}<span aria-hidden="true"> ↗</span></strong></Link></li>)}</ul>
          {!ministries.length&&<p>Question records are not yet available.</p>}
          <Link className="investigate-link" href={`${base}?view=questions`}>all {ready?records.questions.length:''} questions & answers ↗</Link>
          <details className="other-parliament"><summary>what else is in the parliamentary record? <span aria-hidden="true">↓</span></summary><div className="reveal-body"><ul className="other-records">{[
            {value:parliamentary?.debates.value,label:'debate participations',view:'interventions'},
            {value:parliamentary?.bills.value,label:'private bill introductions',view:'bills'},
            {value:ready?records.committees.length:null,label:'committee terms',view:'committees'},
            {value:ready?records.attendance.length:null,label:'attendance sessions',view:'attendance'},
          ].map(item=><li key={item.view}><Link href={`${base}?view=${item.view}`}><strong>{item.value??'Not available'}</strong> {item.label} ↗</Link></li>)}</ul><p className="reveal-note">Attendance is shown by session. Source dates differ; no overall attendance percentage is calculated.</p></div></details>
        </div></details>
      </div>
    </section>

    <section className="moment moment-money" id="money" aria-labelledby="money-label">
      <div className="moment-core">
        <StoryImage moment="money"/>
        <p className="fact-money"><Amount value={funds?.recommended.value}/></p>
        <h2 id="money-label" className="moment-label">public works recommended</h2>
        <div className="fact-caption"><span>{funds?.recommended.value!=null?formatRupees(funds.recommended.value):'Not available'} · {mp.term.label}</span>{peek(moneySources(funds?.recommended),'MPLADS recommendations','Recommendations are not expenditure or completed works. These are tenure totals; the source supplies no reporting cut-off. Allocation, sanction, release and expenditure are separate fields.')}</div>
        <UpdateFlag state={profile.ingestion?.mplads}/>
        <div className="story-works-entry">
          <p><strong>{moneyReady ? projects.length : 'Data integration in progress'}</strong> public works</p>
          <Link className="civic-action" href={`/works?pin=${encodeURIComponent(activePin)}`}>Explore public works →</Link>
          <p className="moment-note">Open a project. Read its record. Help document what you see.</p>
        </div>
        <details className="tap-reveal money-reveal"><summary>where did it go? <span aria-hidden="true">↓</span></summary><div className="reveal-body">
          {funds ? <>
            <div className="revealed-fact"><p className="reveal-money"><Amount value={funds.sanctioned.value}/></p><h3>sanctioned</h3><div className="fact-caption"><span>{funds.sanctioned.value!==null?formatRupees(funds.sanctioned.value):'Not supplied'}</span>{peek(funds.sanctioned.sourceRefs,'MPLADS sanctions')}</div></div>
            <div className="revealed-fact"><p className="reveal-money"><Amount value={funds.spent.value}/></p><h3>expenditure recorded</h3><div className="fact-caption"><span>{funds.spent.value!==null?formatRupees(funds.spent.value):'Not supplied'}</span>{peek(funds.spent.sourceRefs,'MPLADS expenditure','Recorded expenditure transactions, not an assessment of completion. The reporting cut-off is not supplied.')}</div></div>
            <div className="revealed-fact"><p className="reveal-number">{moneyReady?projects.length:'Data integration in progress'}</p><h3>works found</h3><p className="reveal-note">Across the constituency. Work locations have not been mapped to your PIN. Conflicting source statuses remain visible in the records.</p></div>
            <Link className="investigate-link" href="/works">see all {moneyReady?projects.length:''} works & citizen checks ↗</Link>
            <Link className="quiet-detail-link" href={`${base}?view=money`}>full financial record ↗</Link>
          </> : <p>Data integration in progress.</p>}
        </div></details>
      </div>
    </section>

    <section className="moment moment-sources" id="receipts" aria-labelledby="receipts-title">
      <div className="moment-core"><h2 id="receipts-title">Every number<br/>has a source.</h2>
        <details className="tap-reveal receipts-reveal"><summary>show sources <span aria-hidden="true">↓</span></summary><div className="reveal-body source-families">
          {[
            {name:'Digital Sansad',source:family('sansad-questions','digital-sansad-activity')},
            {name:'Election affidavit / ECI',source:family('eci-affidavit-2024','eci-affidavit-2024')},
            {name:'MPLADS / MoSPI',source:family('mplads-summary','mplads-portal')},
          ].map(item=><div key={item.name}><h3>{item.name}</h3>{peek(item.source?[item.source.id]:[],item.name,item.name.includes('affidavit')?'Exact candidate-document re-verification is outstanding.':undefined)}</div>)}
          <Link className="investigate-link" href={`${base}?view=sources`}>every source & retrieval detail ↗</Link>
          <Link className="quiet-detail-link" href="/methodology">how we read the record ↗</Link>
        </div></details>
        <p className="closing-whisper">See the source. Decide what it means.</p>
      </div>
    </section>
  </div>;
}
