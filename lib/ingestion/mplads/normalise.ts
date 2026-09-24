import type { FundSummary, Metric } from '@/types/civic';
import type { MpladsSummaryRaw } from './types';
import { money } from '../validate';

/**
 * Map the portal's reported figures onto `FundSummary`.
 *
 * A figure the report did not publish becomes a `pending` metric with a null
 * value  -  never a zero. The distinction survives all the way to the page,
 * where it renders as an em dash rather than as "₹0", because "not reported"
 * and "nothing spent" would otherwise look identical to a citizen.
 *
 * Nothing here is inferred or computed. Every value comes from a cell in the
 * official report or stays absent.
 */
export function toFundSummary(options: {
  representativeId: string;
  raw: MpladsSummaryRaw;
  /** Scheme entitlement from the guidelines, not from the report. */
  entitlement: Metric<number>;
  period: string;
  schemeNotes: string[];
  sourceRefs: string[];
}): FundSummary {
  const { representativeId, raw, entitlement, period, schemeNotes, sourceRefs } = options;

  const reported = (label: string, value: number | undefined, note: string): Metric<number> => ({
    label,
    value: value === undefined ? null : money(value),
    format: 'currency-inr',
    availability: value === undefined ? 'pending' : 'published',
    reportingPeriod: raw.reportedAsOn ? `As reported on ${raw.reportedAsOn}` : period,
    note,
    sourceRefs,
  });

  return {
    representativeId,
    scheme: 'MPLADS',
    period: raw.reportedAsOn ? `As reported on ${raw.reportedAsOn}` : period,
    entitlement,
    allocatedLimit: reported('Allocated limit', raw.allocatedLimit, 'The dashboard allocation for this term. Distinct from the annual scheme entitlement and from a release.'),
    released: reported('Amount released', raw.released, 'Not supplied in the retrieved report. Allocation is not treated as release.'),
    utilization: { label:'Utilization', value:null, format:'percent', availability:'no-data', note:'Not supplied as a percentage in the retrieved report; not calculated from unlike funding measures.', sourceRefs },
    recommended: reported(
      'Amount recommended',
      raw.recommended,
      'Value of works the member has recommended to the District Authority.',
    ),
    sanctioned: reported(
      'Amount sanctioned',
      raw.sanctioned,
      'Value of recommended works the District Authority has approved.',
    ),
    spent: reported(
      'Amount spent',
      raw.spent,
      'Expenditure reported against sanctioned works.',
    ),
    balance: reported(
      'Amount remaining',
      raw.balance,
      'Unspent balance held with the District Authority, as the report states it. Not computed by us.',
    ),
    schemeNotes,
    sourceRefs,
  };
}
