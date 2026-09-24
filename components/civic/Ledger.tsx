import type { FundSummary, ProjectRecord } from '@/types/civic';
import Link from 'next/link';
import { formatMetricValue, formatRupees, splitRupees, formatDate } from '@/lib/format';
import { SourceFootnote } from './Evidence';
import { CivicLabel } from './Data';
import { cn } from '@/components/ui/cn';

/**
 * MPLADS as a ledger.
 *
 * Rows follow the order of the process  -  entitlement, recommended, sanctioned,
 * spent, remaining  -  because that sequence is the thing most easily misread.
 * No gauges, no rings, no completion percentages: a ratio here would read as a
 * score, and the money is not the member's to be scored on.
 */
export function FundLedger({ funds }: { funds: FundSummary }) {
  const rows = [
    { key: 'entitlement', metric: funds.entitlement },
    ...(funds.allocatedLimit?[{key:'allocated',metric:funds.allocatedLimit}]:[]),
    ...(funds.released?[{key:'released',metric:funds.released}]:[]),
    { key: 'recommended', metric: funds.recommended },
    { key: 'sanctioned', metric: funds.sanctioned },
    { key: 'spent', metric: funds.spent },
    { key: 'balance', metric: funds.balance },
  ];

  return (
    <div>
      <dl>
        {rows.map(({ key, metric }) => {
          const missing = metric.value === null || metric.value === undefined;
          const parts =
            !missing && typeof metric.value === 'number' ? splitRupees(metric.value) : null;

          return (
            <div
              key={key}
              className="grid grid-cols-1 gap-x-8 gap-y-2 border-t border-ink/20 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:py-7"
            >
              <div className="min-w-0">
                <dt className="font-display text-mid uppercase text-ink">{metric.label}</dt>
                {metric.note && (
                  <p className="mt-2 max-w-read text-pretty text-sm leading-relaxed text-ink/70">
                    {metric.note}
                  </p>
                )}
              </div>

              <dd className="sm:text-right">
                {missing ? (
                  <span className="tag block text-cobalt">{formatMetricValue(metric)}</span>
                ) : (
                  <>
                    <span className="num font-display text-datum-sm text-ink">
                      <span className="align-top text-[0.4em] text-cobalt">{parts?.symbol}</span>
                      {parts?.amount}
                      {parts?.unit && (
                        <span className="ml-[0.18em] text-[0.3em] tracking-tight">
                          {parts.unit}
                        </span>
                      )}
                    </span>
                    <span className="tag mt-1 block text-ink/60">
                      {formatRupees(metric.value as number)}
                    </span>
                  </>
                )}
              </dd>
              <div className="min-w-0 sm:col-span-2">
                <p className="mt-2 text-xs text-ink/70">{metric.reportingPeriod}</p>
                <SourceFootnote sourceIds={metric.sourceRefs} className="mt-3"/>
              </div>
            </div>
          );
        })}
      </dl>
      {funds.utilization&&<p className="mt-6 text-sm text-ink/75">Utilization percentage: not supplied in this report. No ratio is inferred.</p>}

      {/* The rules that prevent the wrong inference. */}
      <div className="mt-12 grid gap-8 border-t border-ink/20 pt-8 md:grid-cols-3">
        {funds.schemeNotes.map((note, i) => (
          <div key={note}>
            <CivicLabel tone="cobalt">{String(i + 1).padStart(2, '0')}</CivicLabel>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-ink/80">{note}</p>
          </div>
        ))}
      </div>

      <SourceFootnote sourceIds={funds.sourceRefs} className="mt-10" />
    </div>
  );
}

const STATUS_LABEL: Record<NonNullable<ProjectRecord['status']>, string> = {
  recommended: 'Recommended',
  sanctioned: 'Sanctioned',
  'in-progress': 'In progress',
  completed: 'Completed',
};

/** Only figures the report actually published. A blank cell is not a zero. */
function amountRows(project: ProjectRecord) {
  return (
    [
      ['Recommended', project.amountRecommended],
      ['Sanctioned', project.amountSanctioned],
      ['Spent', project.amountSpent],
    ] as const
  )
    .filter(([, value]) => typeof value === 'number')
    .map(([label, value]) => ({ label, value: formatRupees(value as number) }));
}

/**
 * Work-level records, set as a register rather than a table.
 *
 * Renders nothing when there are no records  -  the chapter says so in words
 * instead. There is deliberately no placeholder row: an invented work sitting
 * under a named MP is the one thing on this site that would travel without its
 * caption attached.
 *
 * Attribution rule: this states what the record states  -  recommended,
 * sanctioned, completed. It never says the member built anything. Sanction and
 * execution sit with the District Authority.
 */
export function WorkRegister({ projects }: { projects: ProjectRecord[] }) {
  if (projects.length === 0) return null;

  return (
    <div>
      <ul className="grid gap-px bg-ink/15 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project, i) => (
          <li key={project.id} className="bg-chalk p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <CivicLabel tone="muted">Work {String(i + 1).padStart(3, '0')}</CivicLabel>
              {project.status && (
                <CivicLabel tone="cobalt">{STATUS_LABEL[project.status]}</CivicLabel>
              )}
            </div>

            {/* The government's own text, verbatim. Any normalised title we
                derive is shown beneath it, never in place of it. */}
            <h3 className="mt-4 font-display text-mid uppercase leading-tight text-ink">
              {project.officialTitle}
            </h3>
            {project.description&&<p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{project.description}</p>}
            <p className="mt-3 text-xs text-ink/70">Record ID: {project.id}</p>
            {/^mplads:\d+$/.test(project.id) && <Link className="mt-3 inline-block min-h-11 py-2 text-sm underline" href={`/works/${project.id.slice(7)}`}>Public work & citizen checks ↗</Link>}
            {project.officialStatus&&<p className="mt-3 text-sm">Reported stage: {project.officialStatus}</p>}
            {project.statusNote&&<p className="mt-2 text-sm leading-relaxed">{project.statusNote}</p>}
            {project.districtAuthority&&<p className="mt-3 text-sm">District authority: {project.districtAuthority}</p>}
            {project.implementingAgency&&<p className="mt-3 text-sm">Implementing agency: {project.implementingAgency}</p>}
            {project.recommendationDate&&<p className="mt-3 text-sm">Recommended: {formatDate(project.recommendationDate)}</p>}
            {project.sanctionDate&&<p className="mt-2 text-sm">Sanctioned: {formatDate(project.sanctionDate)}</p>}
            {project.reportingPeriod&&<p className="mt-3 text-xs leading-relaxed">{project.reportingPeriod}</p>}
            {project.amountSpent===undefined&&<p className="mt-3 text-sm">Work expenditure not supplied in the retrieved transactions.</p>}
            {project.normalizedTitle && project.normalizedTitle !== project.officialTitle && (
              <p className="tag mt-2 text-ink/60">Our summary: {project.normalizedTitle}</p>
            )}

            <dl className="mt-6 grid gap-4">
              {[
                ...(project.category ? [{ label: 'Category', value: project.category }] : []),
                ...(project.locationText
                  ? [{ label: 'Location', value: project.locationText }]
                  : []),
                ...amountRows(project),
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-4 border-t border-ink/15 pt-3"
                >
                  <dt className="tag text-ink/60">{row.label}</dt>
                  <dd className="num text-right text-sm text-ink/85">{row.value}</dd>
                </div>
              ))}
            </dl>

            <SourceFootnote sourceIds={project.sourceRefs} className="mt-6" />
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-read text-pretty text-sm leading-relaxed text-ink/70">
        A work appearing here means the record shows it was recommended, sanctioned or completed
        under the scheme. It does not mean the member built it. Works are executed by the district
        administration.
      </p>
    </div>
  );
}
