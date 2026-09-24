import { NotConnectedError, fetchSnapshot } from "../core";
import type { MpladsDataset, MpladsPayload } from "./types";
export const MPLADS_ROOT = "https://mplads.mospi.gov.in/digigov/dashboard.html";
export const PARSER_VERSION = "mplads-1.0.0";
export const REPORTS = { summary: "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesData", works: "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData", expenditure: "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData" } as const;
export async function fetchMplads(options: { dataset:MpladsDataset; mpladsMemberId?:string; constituencyCode:string; reportKey?:string }):Promise<MpladsPayload> {
  const {dataset,mpladsMemberId,constituencyCode,reportKey} = options;
  if (mpladsMemberId!=="3042793" || constituencyCode!=="270") throw new NotConnectedError("MPLADS", "Verified member and constituency IDs required");
  const combo = "21,270,3042793,2,7";
  const body = JSON.stringify(dataset==="summary"?{uname:combo}:{combo,key:reportKey});
  const snapshot = await fetchSnapshot({source:"mplads",url:REPORTS[dataset],parserVersion:PARSER_VERSION,key:dataset+"-"+(reportKey??"summary").replace(/[^a-zA-Z0-9]/g,"-"),sourceIdentifier:mpladsMemberId,init:{method:"POST",headers:{"content-type":"application/json; charset=utf-8"},body}});
  return {...options,...snapshot};
}
