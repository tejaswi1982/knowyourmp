import Link from 'next/link';
import { listWorks, workId } from '@/lib/works';
import { formatRupees } from '@/lib/format';
import { FollowArea, ContributionSummary } from '@/components/civic/Participation';
import { CONSTITUENCIES_BY_SLUG } from '@/data/constituencies';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Public works · Mumbai North-West', description: 'Public-work records for Mumbai North-West, with official source details and clear limits.', alternates: { canonical: '/works' } };
export default async function WorksPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; pin?: string }> }) {
  const queryParams = await searchParams;
  const works = await listWorks();
  const statuses = [...new Set(works.map(w => w.officialStatus).filter(Boolean))] as string[];
  const categories = [...new Set(works.map(w => w.category).filter(Boolean))] as string[];
  const query = typeof queryParams.q === 'string' ? queryParams.q.slice(0, 120) : '';
  const seat = CONSTITUENCIES_BY_SLUG.get('mumbai-north-west');
  const pin = seat?.samplePins.includes(queryParams.pin ?? '') ? queryParams.pin : undefined;
  const locality = pin && seat?.pinLocalities?.[pin];
  const filtered = works.filter(w => (!query || `${w.officialTitle} ${w.description ?? ''}`.toLowerCase().includes(query.toLowerCase())) && (!queryParams.status || w.officialStatus === queryParams.status) && (!queryParams.category || w.category === queryParams.category));
  const mission = works.find(w => workId(w.id) === '244718') ?? works[0];
  return <div className="civic-page"><Link className="civic-back" href={`/mp/mumbai-north-west${pin ? `?pin=${pin}` : ''}#money`}>← MP / public money</Link>
    <header className="civic-hero"><p className="civic-kicker">Mumbai North-West · Ravindra Dattaram Waikar</p><h1><span className="civic-number">{works.length}</span> public works</h1><p>Public money. Places you may know.<br/>You can help complete the picture.</p><p className="civic-muted">{pin ? `You entered ${pin}${locality ? `, ${locality}` : ''}. ` : ''}These works span the constituency; their locations have not been mapped to your PIN.</p>{pin && <FollowArea pin={pin}/>}</header>
    {mission && <section className="civic-mission"><p className="civic-kicker">A small way to help</p><h2>Can you verify this work?</h2><p>{mission.description ?? mission.officialTitle}</p><p className="civic-muted">Takes about 5 minutes if you are there.</p><Link className="civic-action" href={`/works/${workId(mission.id)}`}>View work →</Link><details><summary>Other ways to help</summary><p>Help locate this project, or find its missing completion date. A source can make the record more useful.</p><Link href={`/works/${workId(mission.id)}/documents`}>Help complete this record →</Link></details></section>}
    <section aria-label="Explore public works"><form className="civic-filters"><label>Locality / work search<input name="q" defaultValue={query} placeholder="For example, Jogeshwari" maxLength={120}/></label><label>Official status<select name="status" defaultValue={queryParams.status ?? ''}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><label>Official category<select name="category" defaultValue={queryParams.category ?? ''}><option value="">All categories</option>{categories.map(s => <option key={s}>{s}</option>)}</select></label><button className="civic-action">Explore</button><Link href="/works">All works</Link></form><p className="civic-muted">Location search uses the official description. No precise locations or distances are available.</p><p>{filtered.length} works shown</p>
    <ol className="civic-works">{filtered.map(w => <li key={w.id}><Link href={`/works/${workId(w.id)}`}><span className="civic-kicker">Work {workId(w.id)}</span><h2>{w.description ?? w.officialTitle}</h2><p>{w.amountRecommended == null ? 'Recommended amount not supplied' : `${formatRupees(w.amountRecommended)} recommended`}</p><p className="civic-muted">Official status: {w.officialStatus}</p><span className="civic-open-work">Open project & citizen checks →</span></Link></li>)}</ol>{!filtered.length && <p>No works match these filters. <Link href="/works">Show all works</Link>.</p>}</section><ContributionSummary/>
    <footer className="civic-footer">For citizens, by citizens. Evidence over opinion.</footer>
  </div>;
}
