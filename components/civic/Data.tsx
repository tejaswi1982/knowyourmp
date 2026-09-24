import type { Availability, Metric } from '@/types/civic';
import { formatMetricValue, formatRupees, splitRupees } from '@/lib/format';
import { SourceFootnote } from './Evidence';
import { cn } from '@/components/ui/cn';

/**
 * Data expression patterns.
 *
 * These replace the one-size MetricCard. They share its logic  -  formatting,
 * availability states, caveats, provenance  -  but each renders at a different
 * scale and weight, so a page can give figures unequal importance instead of
 * lining them all up in matching rectangles.
 *
 * Every pattern here obeys the same two rules:
 *   1. A figure never appears without its source.
 *   2. A pending value renders as an em dash and a named source, never as 0.
 */

/* -------------------------------------------------------------------------- */
/*  Labels                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The catalogue mark: `MH-27`, `400053`, `18LS`, `ECI · 2024`.
 * Orientation, not decoration  -  it tells you where in the country you are.
 */
export function CivicLabel({
  children,
  tone = 'default',
  size = 'sm',
  className,
}: {
  children: React.ReactNode;
  /**
   * `none` applies no colour class  -  use it when the call site supplies its own
   * text colour, since two competing `text-*` utilities resolve by stylesheet
   * order rather than by which one was written last.
   */
  tone?: 'default' | 'muted' | 'acid' | 'cobalt' | 'invert' | 'invert-muted' | 'none';
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const toneClass = {
    default: 'text-ink',
    muted: 'text-ink/60',
    acid: 'text-acid',
    cobalt: 'text-cobalt',
    invert: 'text-chalk',
    'invert-muted': 'text-chalk/55',
    none: '',
  }[tone];

  return (
    <span className={cn(size === 'lg' ? 'tag-lg' : 'tag', toneClass, className)}>{children}</span>
  );
}

/** The status word for a non-published figure. Never rendered for `published`. */
function statusWord(availability: Availability): string | null {
  switch (availability) {
    case 'published':
      return null;
    case 'pending':
      return 'Not yet connected';
    case 'demo':
      return 'Demo structure';
    case 'unavailable':
      return 'Not published';
    case 'source-unavailable':
      return 'Source unavailable';
    case 'no-data':
      return 'No comparable data available';
  }
}

/* -------------------------------------------------------------------------- */
/*  Hero number                                                                */
/* -------------------------------------------------------------------------- */

/**
 * One figure, at the scale of an image.
 *
 * Rupee values are split so the amount can be set as form while the unit rides
 * beside it. The exact figure always follows in the caption  -  the headline is
 * rounded, the record is not.
 */
export function HeroNumber({
  metric,
  scale = 'lg',
  onInk = false,
  align = 'left',
  className,
}: {
  metric: Metric;
  scale?: 'lg' | 'md';
  onInk?: boolean;
  align?: 'left' | 'right';
  className?: string;
}) {
  const missing = metric.value === null || metric.value === undefined;
  const status = statusWord(metric.availability);
  const isRupees = metric.format === 'currency-inr' && typeof metric.value === 'number';
  const parts = isRupees ? splitRupees(metric.value as number) : null;
  const sizeClass = scale === 'lg' ? 'money-figure' : 'money-figure-small';

  return (
    <div className={cn('fit min-w-0', align === 'right' && 'text-right', className)}>
      <CivicLabel tone={onInk ? 'invert' : 'default'}>{metric.label}</CivicLabel>

      <p
        className={cn(
          'mt-3 font-display',
          sizeClass,
          missing ? (onInk ? 'text-chalk/55' : 'text-ink/60') : onInk ? 'text-chalk' : 'text-ink',
        )}
      >
        {missing ? (
          <span aria-label={status ?? 'No value'}>&mdash;</span>
        ) : parts ? (
          <>
            <span className={cn('align-top text-[0.42em]', onInk ? 'text-acid' : 'text-cobalt')}>
              {parts.symbol}
            </span>
            <span className="num">{parts.amount}</span>
            {parts.unit && (
              // Wide enough to read as a separate word: at 0.08em the pair set
              // solid as "54.5CR".
              <span className="ml-[0.18em] align-baseline text-[0.3em] tracking-tight">
                {parts.unit}
              </span>
            )}
          </>
        ) : (
          <span className="num">{formatMetricValue(metric)}</span>
        )}
      </p>

      {/* Exact figure  -  the headline above it is rounded, this one is not. */}
      {isRupees && (
        <p className={cn('tag mt-3', onInk ? 'text-chalk/60' : 'text-ink/65')}>
          {formatRupees(metric.value as number)}
        </p>
      )}

      {status && (
        <p className={cn('tag mt-3', onInk ? 'text-acid' : 'text-cobalt')}>{status}</p>
      )}

      {metric.reportingPeriod && (
        <p className={cn('tag mt-2', onInk ? 'text-chalk/55' : 'text-ink/60')}>
          {metric.reportingPeriod}
        </p>
      )}

      {metric.note && (
        <p
          className={cn(
            'mt-4 max-w-note text-pretty text-sm leading-relaxed',
            onInk ? 'text-chalk/70' : 'text-ink/75',
          )}
        >
          {metric.note}
        </p>
      )}

      <SourceFootnote sourceIds={metric.sourceRefs} onInk={onInk} className="mt-4" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline datum                                                               */
/* -------------------------------------------------------------------------- */

/**
 * A fact set as a line of type inside an editorial composition, rather than
 * boxed. `B.SC · PATKAR COLLEGE · 1982` is typography, not a card.
 */
export function InlineDatum({
  label,
  value,
  detail,
  sourceIds = [],
  onInk = false,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  sourceIds?: string[];
  onInk?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <CivicLabel tone={onInk ? 'invert-muted' : 'muted'}>{label}</CivicLabel>
      <p
        className={cn(
          'mt-2 font-display text-big text-balance',
          onInk ? 'text-chalk' : 'text-ink',
        )}
      >
        {value}
      </p>
      {detail && (
        <p
          className={cn(
            'mt-4 max-w-read text-pretty leading-relaxed',
            onInk ? 'text-chalk/75' : 'text-ink/80',
          )}
        >
          {detail}
        </p>
      )}
      <SourceFootnote sourceIds={sourceIds} onInk={onInk} className="mt-4" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Activity ledger                                                            */
/* -------------------------------------------------------------------------- */

export interface ActivityRow {
  metric: Metric;
  /**
   * Where the individual records live, once there are any. A count without a
   * way to reach the records behind it is a claim; with the link it is
   * evidence. Rows render as links only when a count and a destination both
   * exist, so the affordance never promises something that isn't there.
   */
  href?: string;
}

/**
 * The parliamentary ledger.
 *
 * One ruled line per measure, label left, figure right. It reads the same
 * whether the figures are present or pending: an em dash is a legible value,
 * and the row keeps its place in the register instead of becoming an empty
 * card that looks broken.
 */
export function ActivityLedger({
  rows,
  onInk = false,
  className,
}: {
  rows: ActivityRow[];
  onInk?: boolean;
  className?: string;
}) {
  return (
    <dl className={cn('grid', className)}>
      {rows.map(({ metric, href }) => {
        const missing = metric.value === null || metric.value === undefined;
        const linked = Boolean(href) && !missing;

        const figure = (
          <span
            className={cn(
              'num font-display text-mid',
              missing
                ? onInk
                  ? 'text-chalk/55'
                  : 'text-ink/60'
                : onInk
                  ? 'text-acid'
                  : 'text-cobalt',
            )}
          >
            {missing ? (
              <span aria-label={statusWord(metric.availability)??'No value'}>&mdash;</span>
            ) : (
              formatMetricValue(metric)
            )}
            {linked && (
              <span aria-hidden="true" className="ml-2">
                &rarr;
              </span>
            )}
          </span>
        );

        return (
          <div
            key={metric.label}
            className={cn(
              'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-2 border-t py-5 sm:py-6',
              onInk ? 'border-chalk/20' : 'border-ink/20',
            )}
          >
            <dt className={cn('font-display text-mid uppercase', onInk ? 'text-chalk' : 'text-ink')}>
              {metric.label}
            </dt>
            <dd>
              {linked ? (
                <a
                  href={href}
                  className="inline-flex min-h-[44px] items-center hover:underline"
                  aria-label={`${metric.label}: ${formatMetricValue(metric)}. See the records.`}
                >
                  {figure}
                </a>
              ) : (
                figure
              )}
            </dd>
            <dd className="col-span-2 text-xs leading-relaxed text-ink/70">
              {missing&&<p>{statusWord(metric.availability)}</p>}
              {metric.reportingPeriod&&<p className="mt-1">{metric.reportingPeriod}</p>}
              {metric.note&&<p className="mt-1">{metric.note}</p>}
              <SourceFootnote sourceIds={metric.sourceRefs} onInk={onInk} className="mt-3"/>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ticker                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Horizontal metadata strip. Carries civic coordinates across a boundary
 * between chapters  -  closer to a platform indicator board than to a banner.
 *
 * Content is duplicated once and the track translates by -50%, so the loop is
 * seamless. Marked `aria-hidden`: it is orientation, and everything in it is
 * stated in real text elsewhere on the page.
 */
export function DataTicker({
  items,
  tone = 'ink',
}: {
  items: string[];
  tone?: 'ink' | 'acid' | 'cobalt';
}) {
  const toneClass = {
    ink: 'bg-ink text-chalk',
    acid: 'bg-acid text-ink',
    cobalt: 'bg-cobalt text-chalk',
  }[tone];

  const run = [...items, ...items];

  return (
    <div className={cn('overflow-hidden py-3', toneClass)} aria-hidden="true">
      <div className="ticker-track">
        {run.map((item, i) => (
          <span key={i} className="tag flex shrink-0 items-center gap-10 whitespace-nowrap">
            {item}
            <span className="opacity-40">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
