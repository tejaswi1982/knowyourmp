import type { AttendanceSessionRecord } from "@/types/civic";
import type { ParseResult, SansadPayload } from "./types";
import { attendanceRecord } from "./parse";
export function parseAttendance(payload: SansadPayload): ParseResult<AttendanceSessionRecord> {
  const records = [attendanceRecord(payload)];
  return { ok: true, records, warnings: [], manifest: payload.manifest };
}
