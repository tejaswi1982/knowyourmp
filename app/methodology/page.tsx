import type { Metadata } from 'next';
import Link from 'next/link';
import { allSources } from '@/data/sources';
export const dynamic = 'force-dynamic';
import { TOTAL_LOK_SABHA_SEATS } from '@/data/constituencies';
import { getCoverage } from '@/lib/repository';
import { fitFontSize } from '@/lib/typography';
import { CivicLabel } from '@/components/civic/Data';
import { SourceRegister } from '@/components/civic/Evidence';

export const metadata: Metadata = {
  title: 'Methodology',
  description:
    'What this project is, what it refuses to do, how to read the data, and where every figure comes from.',
  alternates: { canonical: '/methodology' },
};

/**
 * Methodology.
 *
 * The one page built for reading rather than for impact. Same palette and type
 * system, much quieter composition: a single measure column, generous leading,
 * and the long explanations that the rest of the site deliberately omits.
 */

const WILL = [
  'Show the source for every figure',
  'Show when it was read and what period it covers',
  'Separate what the record says from what it might mean',
  'Say plainly when data is missing, and why',
  'Explain the terms that are easy to misread',
  'Keep source corrections and retrieval dates visible',
];

const WILL_NOT = [
  'Score, grade or rate an MP',
  'Rank MPs against each other',
  'Call a record good or bad',
  'Endorse or oppose any party or candidate',
  'Suggest guilt from a declared case',
  'Claim an MP built something the source does not credit to them',
];

const READINGS = [
  {
    n: '01',
    title: 'Declared criminal cases',
    body: [
      'Candidates must declare, on oath, the criminal cases pending against them at nomination. The number is that declaration.',
      'A declared pending case is not a conviction or a finding of guilt. Read the cited affidavit for the reported case details and stage of proceedings.',
      'The count carries no weight information either: three minor cases and three grave ones both read as 3. If the number matters to you, follow it to the affidavit and read the sections and the stage each case has reached. That is why the link is there.',
    ],
  },
  {
    n: '02',
    title: 'Declared assets and liabilities',
    body: [
      'Self-declared totals for the candidate, their spouse and dependants, as of the nomination date. Read the cited declaration for the valuation basis of each item.',
      'Read the two together. A large asset figure alongside a large liability figure describes a different situation from the same asset figure alone.',
    ],
  },
  {
    n: '03',
    title: 'Parliamentary activity',
    body: [
      'Attendance, questions, debates and bills are counts of participation published by the Lok Sabha Secretariat. They measure how often, not how well.',
      'They also carry structural caveats: ministers do not question their own government, and much substantive work happens in committees these counts do not capture. We publish the count and the caveat together, and never convert them into a performance figure.',
    ],
  },
  {
    n: '04',
    title: 'MPLADS funds',
    body: [
      'Each MP may recommend works worth ₹5 crore a year in their constituency. The money is never held by the member: the District Authority sanctions the works, executes them and reports the expenditure.',
      'Allocation, recommendation, sanction and expenditure are separate stages. The displayed financial totals cover the selected tenure; the portal does not supply an explicit reporting cut-off. They are not a measure of an individual member’s performance.',
    ],
  },
];

/**
 * The parliamentary counting rules, published verbatim alongside the code that
 * implements them (`lib/parliament.ts`).
 */
const COUNTING: [string, string][] = [
  [
    'Questions',
    'Unique official question IDs on which the member is listed as a questioner. Questions are often tabled jointly, so one question can appear on several members’ records  -  but only once on each.',
  ],
  [
    'Debates',
    'Unique official participation records. Not pages on which the member’s name appears: a name in a transcript is frequently another member referring to them, and counting those would inflate the figure substantially.',
  ],
  [
    'Bills',
    'Private member bills introduced by the member. Government bills they spoke on are not counted  -  private member bills are rare, and folding in government bills would make the number meaningless.',
  ],
  [
    'Attendance',
    'Shown by session. Signed entries are counted using the official attendance codes. A fraction is published only when dates reconcile with the session calendar. Not signed is not inferred absence. No lifetime or aggregate percentage is published.',
  ],
];

const STATES = [
  ['Published', 'Attributed to a named source. Ingested records pass identity, schema, date, duplication and reconciliation checks. These checks do not independently establish the accuracy of the source itself.'],
  ['Not yet connected', 'The source exists and is named; the integration is not built. Shown as “Not yet integrated”, never as zero.'],
  ['Source unavailable', 'A failed update retains the last successful snapshot and displays the failure. Without a usable snapshot, figures stay unavailable.'],
  ['No comparable data', 'Records exist but do not support the requested statistic. The reason is shown; missing values never become zero.'],
  ['Stale or partial', 'Retrievals older than 30 days and known coverage or source conflicts are disclosed alongside the records.'],
  ['Not published', 'No public body publishes this figure. We say so rather than estimate it.'],
];

export default async function MethodologyPage() {
  const coverage = await getCoverage();
  const sources = allSources();

  return (
    <>
      {/* ---- Masthead ---- */}
      <section className="border-b border-ink/20">
        <div className="frame py-14 sm:py-20">
          <CivicLabel tone="cobalt">Methodology</CivicLabel>
          <h1 className="mt-6 max-w-[14ch] font-display text-huge uppercase text-ink">
            How this is built
          </h1>
          <p className="mt-8 max-w-read text-pretty text-lg leading-relaxed text-ink/80">
            A site about public records has to be accountable for its own. What follows is where
            each figure comes from, how to read the harder ones, and the rules this project holds
            itself to.
          </p>
        </div>
      </section>

      {/* ---- The rules ---- */}
      <section className="frame py-16 sm:py-24">
        <div className="grid12 gap-y-12">
          <div className="col-span-4 md:col-span-5">
            <CivicLabel tone="muted">This site will</CivicLabel>
            <ul className="mt-6">
              {WILL.map((item) => (
                <li
                  key={item}
                  className="border-t border-ink/20 py-4 text-pretty leading-relaxed text-ink/85"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-4 md:col-span-5 md:col-start-7">
            <CivicLabel tone="cobalt">This site will not</CivicLabel>
            <ul className="mt-6">
              {WILL_NOT.map((item) => (
                <li
                  key={item}
                  className="border-t border-ink/20 py-4 text-pretty leading-relaxed text-ink/85"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-14 max-w-read text-pretty leading-relaxed text-ink/75">
          The reason for the second list: a score is an argument wearing the clothes of a fact. The
          moment a site assigns one, it has stopped being a record and started being an opinion, and
          you have to trust the site rather than the source. We would rather you trusted the source.
        </p>
      </section>

      {/* ---- How to read ---- */}
      <section id="reading" className="scroll-mt-16 bg-ink text-chalk">
        <div className="frame py-16 sm:py-24">
          <CivicLabel tone="acid">How to read the data</CivicLabel>
          <h2 className="mt-6 max-w-[18ch] font-display text-big uppercase">
            Four things that are easy to misread
          </h2>

          <div className="mt-12 grid gap-12 md:grid-cols-2">
            {READINGS.map((item) => (
              <article key={item.n} className="border-t border-chalk/20 pt-6">
                <CivicLabel tone="invert-muted">{item.n}</CivicLabel>
                <h3 className="mt-3 font-display text-mid uppercase text-chalk">{item.title}</h3>
                <div className="mt-4 max-w-read space-y-4 text-pretty leading-relaxed text-chalk/75">
                  {item.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Parliamentary counting ---- */}
      <section id="counting" className="frame scroll-mt-16 py-16 sm:py-24">
        <CivicLabel tone="cobalt">How we count parliamentary work</CivicLabel>
        <h2 className="mt-6 max-w-[20ch] font-display text-big uppercase text-ink">
          What each number counts, exactly
        </h2>
        <p className="mt-6 max-w-read text-pretty leading-relaxed text-ink/80">
          These definitions are implemented in one place in the code, so the published rule and the
          arithmetic cannot drift apart. Where a rule cannot be followed exactly, the figure stays
          unpublished rather than approximated.
        </p>

        <dl className="mt-12 grid gap-x-10 md:grid-cols-2">
          {COUNTING.map(([term, detail]) => (
            <div key={term} className="border-t border-ink/20 py-6">
              <dt className="font-display text-mid uppercase text-ink">{term}</dt>
              <dd className="mt-3 max-w-read text-pretty leading-relaxed text-ink/75">{detail}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-read text-pretty leading-relaxed text-ink/75">
          Counts are derived from individual records. A verified complete empty response may
          produce zero; an unintegrated or failed dataset stays unavailable. Attendance is shown
          by session, with incompatible calendars excluded from fractions.
        </p>
      </section>

      {/* ---- Data states ---- */}
      <section className="frame border-t border-ink/20 py-16 sm:py-24">
        <CivicLabel tone="muted">Data states</CivicLabel>
        <dl className="mt-8 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {STATES.map(([term, detail]) => (
            <div key={term} className="border-t border-ink/20 py-6">
              <dt className="font-display text-mid uppercase text-ink">{term}</dt>
              <dd className="mt-3 max-w-read text-pretty leading-relaxed text-ink/75">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Location logic ---- */}
      <section id="location" className="frame scroll-mt-16 border-t border-ink/20 py-16 sm:py-24">
        <div className="grid12 gap-y-10">
          <div className="col-span-4 md:col-span-5">
            <CivicLabel tone="muted">Location logic</CivicLabel>
            <h2 className="mt-6 max-w-[14ch] font-display text-big uppercase text-ink">
              How a PIN becomes a seat
            </h2>
          </div>

          <div className="col-span-4 max-w-read space-y-4 text-pretty leading-relaxed text-ink/80 md:col-span-6 md:col-start-7">
            <p>
              PIN codes are postal geography. Constituency boundaries are electoral geography, set
              by the Delimitation Commission. They were drawn for different purposes and do not
              align: one PIN can straddle two seats, and a seat contains many PINs.
            </p>
            <p>
              For published seats the mapping is checked by hand against the delimitation order and
              the assembly segments it lists. It is a strong starting point, not a legal
              determination. The authoritative answer for any individual is the constituency printed
              on their electoral roll entry.
            </p>
            <p>
              Locating by device is deliberately not connected. Doing it properly needs a
              point-in-polygon test against published boundary geometry; doing it badly would mean
              confidently showing someone the wrong MP.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Sources ---- */}
      <section className="bg-chalk-deep">
        <div className="frame py-16 sm:py-24">
          <CivicLabel tone="cobalt">The evidence base</CivicLabel>
          <h2 className="mt-6 font-display text-big uppercase text-ink">Every source</h2>
          <div className="mt-12">
            <SourceRegister sources={sources} />
          </div>
        </div>
      </section>

      {/* ---- Roadmap ---- */}
      <section className="frame py-16 sm:py-24">
        <div className="grid12 items-end gap-y-8">
          <div className="fit col-span-4 md:col-span-5">
            <CivicLabel tone="muted">Coverage</CivicLabel>
            <p
              className="num mt-4 font-display leading-[0.9] tracking-[-0.04em] text-ink"
              style={{
                fontSize: fitFontSize(`${coverage.constituenciesLive}/${TOTAL_LOK_SABHA_SEATS}`, {
                  min: '2.5rem',
                  max: '11rem',
                }),
              }}
            >
              {coverage.constituenciesLive}
              <span className="text-ink/60">/{TOTAL_LOK_SABHA_SEATS}</span>
            </p>
          </div>
          <p className="col-span-4 max-w-read text-pretty leading-relaxed text-ink/80 md:col-span-6 md:col-start-7">
            Coverage is currently one constituency. Parliamentary and MPLADS records have source
            snapshots and automated validation. Inherited affidavit facts and PIN mapping retain
            their existing citations and still need exact-document re-verification.
          </p>
        </div>

        <ol className="mt-14">
          {[
            'Resolve gaps between Digital Sansad attendance calendars and entries.',
            'Resolve conflicting MPLADS work stages and obtain an explicit reporting cut-off.',
            'The remaining Lok Sabha constituencies, seat by verified seat.',
            'Nationwide PIN and location lookup against published boundary geometry.',
            'State assemblies, then municipal councillors and local public works.',
            'A route for citizens to flag what the record claims against what is on their street.',
          ].map((item, i) => (
            <li
              key={item}
              className="flex gap-6 border-t border-ink/20 py-5 text-pretty leading-relaxed text-ink/85"
            >
              <span className="tag shrink-0 text-ink/60">{String(i + 1).padStart(2, '0')}</span>
              <span className="max-w-read">{item}</span>
            </li>
          ))}
        </ol>

        <Link
          href="/"
          className="tag-lg mt-12 inline-flex min-h-[44px] items-center gap-2 font-semibold text-cobalt"
        >
          Find your representative <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>
    </>
  );
}
