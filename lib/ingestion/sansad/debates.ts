import type { ParliamentIntervention } from "@/types/civic";
import type { ParseResult, SansadPayload } from "./types";
import { debatePage } from "./parse";
export function parseDebates(payload: SansadPayload): ParseResult<ParliamentIntervention> {
  const records = debatePage(payload).records;
  return { ok: true, records, warnings: [], manifest: payload.manifest };
}
