import type {
  ParliamentaryActivity,
  ParliamentaryRecords,
  RepresentativeProfile,
} from '@/types/civic';
import { CONSTITUENCIES_BY_ID } from '@/data/constituencies';
import { collectSources } from '@/data/sources';
import { deriveParliamentaryTotals } from '@/lib/parliament';
import * as waikar from './ravindra-waikar';

/**
 * Representative registry.
 *
 * Each MP is one module in this folder exporting the same named members.
 * Adding the 2nd or the 543rd means writing that module and adding one
 * line to `SEED_MODULES`. Nothing else in the codebase changes.
 */

interface SeedModule {
  representative: typeof waikar.representative;
  affidavit: typeof waikar.affidavit | null;
  parliamentaryMeta: typeof waikar.parliamentaryMeta;
  parliamentaryRecords: ParliamentaryRecords;
  funds: typeof waikar.funds | null;
  projects: typeof waikar.projects;
  lastReviewed: string;
}

const SEED_MODULES: SeedModule[] = [waikar];

/**
 * Compose the headline activity block from record-level data.
 *
 * Totals are computed, never stored: with no records the metrics come back
 * `pending`, which is the honest state, and once ingestion lands the same
 * function starts returning `published` figures with no change here.
 */
function toActivity(mod: SeedModule): ParliamentaryActivity {
  const totals = deriveParliamentaryTotals(
    mod.parliamentaryRecords,
    mod.parliamentaryMeta.sourceRefs,
  );

  return {
    representativeId: mod.parliamentaryMeta.representativeId,
    session: mod.parliamentaryMeta.session,
    ...totals,
    committees: mod.parliamentaryRecords.committees,
    sourceRefs: mod.parliamentaryMeta.sourceRefs,
  };
}

/** Assemble a flat seed module into the aggregate shape the pages consume. */
function toProfile(mod: SeedModule): RepresentativeProfile {
  const constituency = CONSTITUENCIES_BY_ID.get(mod.representative.constituencyId);
  if (!constituency) {
    // A representative without a constituency is a data error, not a runtime
    // condition to render around. Fail loudly at import time.
    throw new Error(
      `Seed data error: no constituency "${mod.representative.constituencyId}" for ${mod.representative.slug}`,
    );
  }

  return {
    representative: mod.representative,
    constituency,
    affidavit: mod.affidavit,
    parliamentary: toActivity(mod),
    parliamentaryRecords: mod.parliamentaryRecords,
    funds: mod.funds,
    projects: mod.projects,
    sources: collectSources(
      mod.representative.sourceRefs,
      mod.affidavit?.sourceRefs,
      mod.parliamentaryMeta.sourceRefs,
      mod.funds?.sourceRefs,
      constituency.lookupMetadata.sourceRefs,
      ...mod.projects.map((p) => p.sourceRefs),
    ),
    lastReviewed: mod.lastReviewed,
  };
}

export const PROFILES: RepresentativeProfile[] = SEED_MODULES.map(toProfile);

export const PROFILES_BY_REP_SLUG = new Map(PROFILES.map((p) => [p.representative.slug, p]));
export const PROFILES_BY_CONSTITUENCY_SLUG = new Map(
  PROFILES.map((p) => [p.constituency.slug, p]),
);
