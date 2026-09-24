import type { SourceReference } from '@/types/civic';
import { formatDate, formatDateStamp } from '@/lib/format';
import { resolveSources } from '@/data/sources';
import { cn } from '@/components/ui/cn';

/**
 * Provenance typography.
 *
 * Source visibility is not administrative metadata here, it is the product's
 * signature. So citations are set in the signage face, at footnote scale, in a
 * fixed grammar that never varies:
 *
 *     ECI · FORM 26 · 2024 ↗
 *
 * They read as archival references  -  record IDs, catalogue marks  -  rather than
 * as tags. Quiet enough to sit under a headline number, specific enough that a
 * citizen can go and check.
 */

/** The arrow that means "this leaves the site and goes to the document". */
function OutMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className={cn('h-2.5 w-2.5', className)}>
      <path d="M2 8L8 2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 2H8v4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

/** Compose the reference line: publisher code, document, period. */
function referenceLine(source: SourceReference): string {
  return [source.code, source.docRef?.toUpperCase(), source.period]
    .filter(Boolean)
    .join(' · ');
}

/**
 * A single inline citation. The default provenance affordance sitewide.
 */
export function EvidenceLink({
  source,
  onInk = false,
  className,
}: {
  source: SourceReference;
  onInk?: boolean;
  className?: string;
}) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer noopener"
      title={`${source.title}  -  ${source.publisher}. Read ${formatDate(source.retrievedAt)}.`}
      className={cn(
        'tag evidence inline-flex items-baseline gap-1.5',
        onInk
          ? 'text-chalk/70 decoration-chalk/30 hover:text-acid hover:decoration-acid'
          : 'text-ink/70 decoration-ink/30 hover:text-cobalt hover:decoration-cobalt',
        className,
      )}
    >
      {referenceLine(source)}
      <OutMark className="translate-y-[1px]" />
    </a>
  );
}

/**
 * The persistent footnote under a datum: every source for that figure, plus
 * the date it was read. Sits at the smallest legible size in the system.
 */
export function SourceFootnote({
  sourceIds,
  onInk = false,
  className,
}: {
  sourceIds: string[];
  onInk?: boolean;
  className?: string;
}) {
  const sources = resolveSources(sourceIds);
  if (sources.length === 0) return null;

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1', className)}>
      {sources.map((source) => <span key={source.id} className="min-w-0">
        <EvidenceLink source={source} onInk={onInk} />{' '}
        <span className={cn('tag', onInk?'text-chalk/55':'text-ink/60')}>read {formatDateStamp(source.retrievedAt)}</span>
      </span>)}
    </p>
  );
}

/**
 * The receipts.
 *
 * A numbered register rather than a list of cards  -  closer to a bibliography or
 * an evidence index than to a set of link tiles.
 */
export function SourceRegister({
  sources,
  onInk = false,
}: {
  sources: SourceReference[];
  onInk?: boolean;
}) {
  return (
    <ol className={cn('grid', onInk ? 'text-chalk' : 'text-ink')}>
      {sources.map((source, i) => (
        <li
          key={source.id}
          className={cn(
            'grid grid-cols-[2.5rem_1fr] gap-x-4 border-t py-6 sm:grid-cols-[4rem_1fr_auto] sm:gap-x-8',
            onInk ? 'border-chalk/20' : 'border-ink/20',
          )}
        >
          <span className={cn('tag pt-1', onInk ? 'text-chalk/55' : 'text-ink/60')}>
            {String(i + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0">
            {/* Archival register, not a set of link tiles: entry text sits at
                reading size so the chapter stays quiet. */}
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                'evidence text-pretty font-medium leading-snug',
                onInk
                  ? 'decoration-chalk/25 hover:text-acid hover:decoration-acid'
                  : 'decoration-ink/25 hover:text-cobalt hover:decoration-cobalt',
              )}
            >
              {source.title}
            </a>
            <p className={cn('tag mt-2', onInk ? 'text-chalk/55' : 'text-ink/60')}>
              {source.publisher}
              {/* Say so when a link reaches the portal but not the document.
                  Inventing a plausible deep link would be worse than admitting
                  the citizen has a search ahead of them. */}
              {source.deepLinkStatus === 'pending' && (
                <span className={onInk ? 'text-chalk/55' : 'text-ink/60'}>
                  {' '}
                  &middot; portal root &middot; deep link pending
                </span>
              )}
            </p>
            {source.note && (
              <p
                className={cn(
                  'mt-3 max-w-read text-pretty text-sm leading-relaxed',
                  onInk ? 'text-chalk/65' : 'text-ink/70',
                )}
              >
                {source.note}
              </p>
            )}
            {!!source.manifests?.length&&<details className="mt-4 text-sm leading-relaxed">
              <summary className="cursor-pointer underline">Retrieval details · {source.official?'official source':'source'} · {source.parserVersion}</summary>
              <p className="mt-3">Reporting period: {source.period}</p>
              <ul className="mt-3 space-y-4">{source.manifests.map(m=><li key={m.storedAt}>
                {m.method==='POST'?<p>POST · {m.sourceUrl}</p>:<a className="evidence text-cobalt" href={m.sourceUrl} target="_blank" rel="noreferrer">GET · source request ↗</a>}
                {m.requestBody&&<p className="mt-1">Report parameters: {m.requestBody}</p>}
                <p className="mt-1">Retrieved: {m.retrievedAt}</p>
                <p className="mt-1">SHA-256: {m.contentHash}</p>
              </li>)}</ul>
            </details>}
          </div>

          <p
            className={cn(
              'tag col-start-2 mt-3 sm:col-start-3 sm:mt-1 sm:text-right',
              onInk ? 'text-chalk/55' : 'text-ink/60',
            )}
          >
            read {formatDate(source.retrievedAt)}
          </p>
        </li>
      ))}
    </ol>
  );
}
