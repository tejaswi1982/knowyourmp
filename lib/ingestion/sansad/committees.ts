import type { CommitteeMembership } from "@/types/civic";
import type { ParseResult, SansadPayload } from "./types";
import { committeeRecords } from "./parse";
export function parseCommittees(payload: SansadPayload): ParseResult<CommitteeMembership> {
  const records = committeeRecords(payload);
  return { ok: true, records, warnings: [], manifest: payload.manifest };
}
