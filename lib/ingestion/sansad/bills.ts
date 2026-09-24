import type { PrivateMemberBillRecord } from "@/types/civic";
import type { ParseResult, SansadPayload } from "./types";
import { billPage } from "./parse";
export function parseBills(payload: SansadPayload): ParseResult<PrivateMemberBillRecord> {
  const records = billPage(payload).records;
  return { ok: true, records, warnings: [], manifest: payload.manifest };
}
