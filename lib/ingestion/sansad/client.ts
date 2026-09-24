import { NotConnectedError, fetchSnapshot } from '../core';
import type { SansadFetchOptions, SansadPayload } from './types';

/**
 * Digital Sansad transport.
 *
 * The single place that talks to sansad.in. Every other module in this folder
 * takes a payload and returns records, so parsing can be tested against stored
 * snapshots with no network involved.
 *
 * ---------------------------------------------------------------------------
 * ENDPOINT RESEARCH  -  REQUIRED BEFORE THIS CAN BE CONNECTED
 * ---------------------------------------------------------------------------
 * The endpoints are not filled in, and are deliberately not guessed. Publishing
 * a wrong figure under a named person's record is worse than publishing none,
 * and a plausible-looking URL invented from the site's URL patterns is the
 * fastest way to get one.
 *
 * Someone needs to sit with the site and the network panel open, then record
 * the findings in `ENDPOINTS` below. Retrieval preference, in order:
 *
 *   1. The structured JSON endpoint the portal itself calls. Check XHR/fetch
 *      while paging through a member's questions. Note the exact request,
 *      required headers, pagination parameters, and whether it needs a session
 *      cookie or an anti-forgery token.
 *   2. The official HTML page, parsed from a snapshot.
 *   3. An official downloadable document (PDF/XLS) where the portal offers one.
 *
 * Never a search engine's results. Never a third party's counts  -  those may be
 * used during development to cross-check our own numbers, and nothing else.
 *
 * Record for each endpoint: URL template, method, parameters, response shape,
 * pagination, observed rate limits, and the date checked. Portals change; a
 * dated note is what tells the next person whether to re-check.
 */
export const ENDPOINTS = {
  /** Member profile by `sansadMemberId`. */
  memberProfile: 'https://sansad.in/api_ls/member/{memberId}?locale=en',
  questions: 'https://sansad.in/api_ls/question/qetAllQuestionsForMember?lkNo=18&mpNo={memberId}&pageNo={page}&pageSize=10&locale=en',
  debates: 'https://sansad.in/api_ls/debate/debate-search?debateTypeId=&loksabha=18&sessionNumber=&fromDate=&toDate=&searchKeyword=&page={page}&size=10&mpCode={memberId}&sortBy&sortOrder&house=LS',
  bills: 'https://sansad.in/api_ls/debate/debate-search?debateTypeId=39&loksabha=18&sessionNumber=&fromDate=&toDate=&searchKeyword=&page={page}&size=10&mpCode={memberId}&sortBy&sortOrder&house=LS',
  attendance: 'https://sansad.in/api_ls/member/getMemberAttendanceByMpsno?loksabha=18&session={session}&mpsno={memberId}',
  committees: 'https://sansad.in/api_ls/committee/findCommitteeMembership?mpsno={memberId}&lsno=18',
} as const;

export const PARSER_VERSION = 'sansad-1.0.0';
export const SESSION_ENDPOINT = 'https://sansad.in/api_ls/member/members-loksabha-session?mpCode={memberId}';

/** Portal root. Used for provenance while deep links are unverified. */
export const SANSAD_ROOT = 'https://sansad.in/ls';

/**
 * Fetch one dataset for one member.
 *
 * Throws `NotConnectedError` until the corresponding endpoint is filled in.
 * The alternative  -  returning an empty array  -  would be indistinguishable from
 * a member with no questions, so it is not offered.
 */
export async function fetchSansad(options: SansadFetchOptions): Promise<SansadPayload> {
  const { dataset, sansadMemberId } = options;

  if (!sansadMemberId) {
    throw new NotConnectedError(
      'Digital Sansad',
      'No sansadMemberId for this representative. Records are joined on official ids, never on names.',
    );
  }

  const template = ENDPOINTS[dataset];
  if (!template) {
    throw new NotConnectedError(
      `Digital Sansad (${dataset})`,
      'Endpoint not recorded yet. See the research note in lib/ingestion/sansad/client.ts.',
    );
  }

  if (dataset==='attendance' && !options.session) throw new NotConnectedError('Attendance', 'Session is required');
  const url = template.replace('{memberId}', encodeURIComponent(sansadMemberId)).replace('{page}', String(options.page ?? 1)).replace('{session}', encodeURIComponent(options.session ?? ''));
  const { manifest, body } = await fetchSnapshot({
    source: 'sansad',
    url,
    parserVersion: PARSER_VERSION,
    key: `${dataset}-${sansadMemberId}-${options.session ?? options.page ?? 1}`,
    sourceIdentifier: sansadMemberId,
  });

  return { dataset, sansadMemberId, manifest, body };
}
