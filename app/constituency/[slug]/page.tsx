import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getConstituency, getProfile, listConstituencies } from '@/lib/repository';
import { formatDate } from '@/lib/format';
import { CivicLabel } from '@/components/civic/Data';
import { SourceFootnote } from '@/components/civic/Evidence';

/**
 * Constituency view.
 *
 * Scaffolded ahead of need: today it describes the seat and hands off to the
 * member's record. It is the natural home for boundary maps, past results and
 * previous members once those datasets exist.
 */

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const constituencies = await listConstituencies();
  return constituencies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const constituency = await getConstituency(slug);
  if (!constituency) return { title: 'Constituency not found' };
  return {
    title: `${constituency.code} ${constituency.name}`,
    description: `Assembly segments, localities and the sitting member for the ${constituency.name} Lok Sabha constituency.`,
    alternates: { canonical: `/constituency/${slug}` },
  };
}

export default async function ConstituencyPage({ params }: PageProps) {
  const { slug } = await params;
  const constituency = await getConstituency(slug);
  if (!constituency) notFound();

  const profile = await getProfile(constituency.slug);

  return (
    <>
      <section className="border-b border-ink/20">
        <div className="frame py-14 sm:py-20">
          <CivicLabel tone="muted">
            {constituency.state} &middot; Lok Sabha constituency
          </CivicLabel>
          <p className="mt-6 font-display text-mega uppercase text-cobalt">
            {constituency.code}
          </p>
          <h1 className="mt-2 font-display text-big uppercase text-ink">
            {constituency.name}
          </h1>
        </div>
      </section>

      <section className="frame py-16 sm:py-20">
        <div className="grid12 gap-y-12">
          <div className="col-span-4 md:col-span-7">
            <CivicLabel tone="muted">
              Assembly segments ({constituency.assemblySegments.length})
            </CivicLabel>
            <ul className="mt-6">
              {constituency.assemblySegments.map((segment, i) => (
                <li
                  key={segment}
                  className="flex items-baseline gap-5 border-t border-ink/20 py-4"
                >
                  <span className="tag text-ink/60">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-mid uppercase text-ink">{segment}</span>
                </li>
              ))}
            </ul>

            <div className="mt-12">
              <CivicLabel tone="muted">PIN codes that resolve here</CivicLabel>
              <p className="num mt-4 font-display text-mid text-ink">
                {constituency.samplePins.join('  ')}
              </p>
              <p className="mt-5 max-w-read text-pretty text-sm leading-relaxed text-ink/70">
                {constituency.lookupMetadata.caveat}
              </p>
              <p className="tag mt-3 text-ink/60">
                Mapping method: {constituency.lookupMetadata.method.replace('-', ' ')} &middot; last
                reviewed {formatDate(constituency.lookupMetadata.lastReviewed)}
              </p>
              <SourceFootnote
                sourceIds={constituency.lookupMetadata.sourceRefs}
                className="mt-4"
              />
            </div>
          </div>

          <aside className="col-span-4 md:col-span-4 md:col-start-9">
            <CivicLabel tone="muted">Localities</CivicLabel>
            <p className="mt-4 text-pretty leading-relaxed text-ink/80">
              {constituency.localities.join(' · ')}
            </p>

            {profile && (
              <Link
                href={`/mp/${constituency.slug}`}
                className="group mt-10 block bg-ink p-7 text-chalk transition-colors hover:bg-ink-raised"
              >
                <CivicLabel tone="invert-muted">Sitting member</CivicLabel>
                <p className="mt-4 font-display text-mid uppercase leading-tight">
                  {profile.representative.fullName}
                </p>
                <p className="tag mt-3 text-acid">{profile.representative.party}</p>
                <span className="tag-lg mt-8 inline-flex items-center gap-2 font-semibold text-chalk">
                  Open the record
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    &rarr;
                  </span>
                </span>
              </Link>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
