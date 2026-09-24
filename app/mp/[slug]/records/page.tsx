import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/repository';
import type { ParliamentaryRecords as Records } from '@/types/civic';
import { ParliamentRecords } from '@/components/civic/ParliamentRecords';
import { WorkRegister, FundLedger } from '@/components/civic/Ledger';
import { SourceRegister } from '@/components/civic/Evidence';
import { IngestionNotice } from '@/components/civic/IngestionNotice';
import { formatRupees } from '@/lib/format';
import { questionsForMinistry } from '@/lib/mp-story';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inspect the record | KnowYourMP', alternates: { canonical: '/mp/mumbai-north-west/records' }, robots: { index: false, follow: true } };
const views = [
  ['questions','Questions'],['interventions','Debates'],['bills','Bills'],['committees','Committees'],['attendance','Attendance'],
  ['works','Works'],['money','Financials'],['affidavit','Affidavit'],['sources','Sources'],
] as const;

export default async function RecordPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{view?:string;ministry?:string}>}) {
  const { slug } = await params;
  const query = await searchParams;
  const profile = await getProfile(slug);
  if(!profile) notFound();
  const view = query.view ?? 'questions';
  if(!views.some(([key])=>key===view)) notFound();
  const label=views.find(([key])=>key===view)![1];
  const parliamentView=['questions','interventions','bills','committees','attendance'].includes(view);
  const affidavit=profile.affidavit;
  const ministry=view==='questions'?query.ministry:undefined;
  const filtered= ministry ? questionsForMinistry(profile.parliamentaryRecords.questions,ministry) : profile.parliamentaryRecords.questions;
  if(ministry && !filtered.length) notFound();
  const records={...profile.parliamentaryRecords,questions:filtered};
  return <div className="frame record-browser">
    <Link className="story-link" href={`/mp/${slug}`}>← Back to the constituency story</Link>
    <p className="story-label mt-6">{profile.constituency.code} / {profile.representative.fullName}</p>
    <h1>{label}: the records</h1>
    <nav className="record-tabs" aria-label="Choose a record collection">{views.map(([key,title])=><Link key={key} href={`?view=${key}`} aria-current={view===key?'page':undefined}>{title}</Link>)}</nav>
    {view==='questions'&&<p className="my-6" data-ministry-context>{ministry?<>Ministry: {ministry} · {filtered.length} records. <Link className="underline" href="?view=questions">Show all questions</Link></>:'All ministries'}</p>}
    {parliamentView && <><IngestionNotice state={profile.ingestion?.sansad}/>{profile.ingestion?.sansad?.lastSuccessAt ? <ParliamentRecords records={records} only={view as keyof Records}/> : <p className="my-10">These records are not yet available.</p>}</>}
    {view==='works' && <><IngestionNotice state={profile.ingestion?.mplads}/><p className="my-8 max-w-read leading-relaxed">All stored official works across the constituency. Source wording is retained. Work locations have not been mapped to a PIN; missing expenditure is not zero.</p>{profile.projects.length ? <WorkRegister projects={profile.projects}/> : <p>Data integration in progress.</p>}</>}
    {view==='money' && <><IngestionNotice state={profile.ingestion?.mplads}/><div className="mt-10">{profile.funds ? <FundLedger funds={profile.funds}/> : <p>Data integration in progress.</p>}</div></>}
    {view==='sources' && <div className="mt-10"><p className="mb-8 max-w-read leading-relaxed">Sources, periods and retrieval details. A portal link may require choosing the member and report. Hashes identify the exact response bytes; they do not certify the underlying claims.</p><SourceRegister sources={profile.sources}/></div>}
    {view==='affidavit' && (affidavit ? <div className="my-10 max-w-read space-y-6 leading-relaxed"><p>As declared at nomination, {affidavit.electionYear}. These inherited values have been preserved; exact-document re-verification is outstanding.</p><dl className="space-y-5"><div><dt className="font-semibold">Declared assets</dt><dd>{affidavit.assets.value===null?'Not available':formatRupees(affidavit.assets.value)}</dd></div><div><dt className="font-semibold">Declared liabilities</dt><dd>{affidavit.liabilities.value===null?'Not available':formatRupees(affidavit.liabilities.value)}</dd></div><div><dt className="font-semibold">Declared criminal cases</dt><dd>{affidavit.criminalCases.declaredCount ?? 'Not available'}</dd></div><div><dt className="font-semibold">Education, as declared</dt><dd>{affidavit.education.value}<br/>{affidavit.educationDetail}</dd></div></dl><p>{affidavit.criminalCases.legalNote}</p><SourceRegister sources={profile.sources.filter(source=>affidavit.sourceRefs.includes(source.id))}/></div> : <p className="my-10">Affidavit data is not available.</p>)}
  </div>;
}
