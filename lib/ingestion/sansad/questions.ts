import type { ParliamentQuestion } from "@/types/civic";
import type { ParseResult, SansadPayload } from "./types";
import { questionPage } from "./parse";
export function parseQuestions(payload: SansadPayload): ParseResult<ParliamentQuestion> {
  const records = questionPage(payload).records;
  return { ok: true, records, warnings: [], manifest: payload.manifest };
}
