import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Site use and data',
  description: 'How to read KnowYourMP public records, their dates, scope, sources, and limitations.',
  alternates: { canonical: '/site-use' },
};

export default function SiteUsePage() {
  return <article className="frame max-w-read py-14 sm:py-20">
    <p className="tag text-cobalt">Site use</p>
    <h1 className="mt-5 font-display text-big uppercase">Read the record with its source</h1>
    <p className="mt-6 leading-relaxed">KnowYourMP presents public information for general civic reference. It is an independent project and is not affiliated with or endorsed by Parliament, the Election Commission of India, a political party, or a candidate.</p>
    <h2 className="mt-10 font-display text-mid uppercase">Dates and limits</h2>
    <p className="mt-4 leading-relaxed">Each record has a source and a retrieval date or reporting period where the publisher supplies one. Government data can be delayed, revised, incomplete, or inconsistent. Read the linked source and its scope before relying on a figure. A missing value is not zero. A postal PIN is only a starting point and does not determine an individual voter’s constituency.</p>
    <p className="mt-4 leading-relaxed">Declared affidavit information is a candidate’s filing, not an independent finding. Attendance and parliamentary activity are published as sourced records, not assessments. MPLADS recommendation, sanction, release, and expenditure are separate stages. Citizen-submitted observations are not independently verified and do not change official records.</p>
    <h2 className="mt-10 font-display text-mid uppercase">Sources and reuse</h2>
    <p className="mt-4 leading-relaxed">Source links identify the public body or record used. External sites are operated by their respective publishers. Photographs and datasets remain subject to their stated licenses and attribution. See <Link className="text-cobalt underline underline-offset-4" href="/methodology">methodology and sources</Link>.</p>
    <p className="mt-10"><Link className="text-cobalt underline underline-offset-4" href="/privacy">Privacy</Link></p>
  </article>;
}
