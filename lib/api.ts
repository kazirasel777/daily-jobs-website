// File: lib/api.ts
// Server-only data layer for the Laravel public API (/api/v1).
// "Not found" (404) and "API unavailable" are kept apart so an outage is never
// published as an empty listing or a permanent 404.
import type {
  JobCategory,
  JobListItem,
  JobDetail,
  DirectorySourceItem,
  JobAvailability,
  PublicJobSource,
  PaginatedResponse,
  SingleResponse,
  Subject,
  QuestionCollection,
  Question,
  CurrentAffair,
  SitemapJobItem,
} from '@/types/job';
import type { NoticeKind, NoticeType, PublicNotice, SitemapNoticeItem } from '@/types/notice';

const DEFAULT_API_BASE_URL = 'https://jobs.kazitechsolutions.com/api/v1';
const FETCH_TIMEOUT_MS = 8000;

/** Seconds a cached API response may be reused before it is refreshed in the background. */
export const REVALIDATE = {
  jobs: 120,
  jobDetail: 300,
  taxonomy: 3600,
  study: 900,
  sources: 900,
  notices: 300,
} as const;

/**
 * Cache tags. Laravel calls /api/revalidate with these after a notice is published,
 * corrected, unpublished or deleted, so the time-based refresh above is only a fallback.
 */
export const CACHE_TAGS = {
  notices: 'notices',
  notice: (id: number | string) => `notice-${id}`,
} as const;

/** Thrown when the API is unreachable or answers with an unexpected error. */
export class ApiUnavailableError extends Error {
  constructor(public readonly endpoint: string, detail: string) {
    super(`Public API unavailable for ${endpoint}: ${detail}`);
    this.name = 'ApiUnavailableError';
  }
}

function getApiBaseUrl(): string {
  return (process.env.API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

/** Our own website server. With the same key set on Laravel (PUBLIC_API_SERVER_KEY) it gets its own,
 * larger rate-limit bucket: every Vercel render comes from a few shared IPs, so a Googlebot crawl
 * used to hit the per-IP limit (429), which the page then showed as a 5xx error. */
function apiHeaders(): Record<string, string> {
  const key = process.env.API_SERVER_KEY?.trim();
  return key ? { Accept: 'application/json', 'X-Server-Key': key } : { Accept: 'application/json' };
}

/** Short, passing failures worth one more try (rate limit, gateway, network blip). */
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const RETRY_DELAY_MS = 400;
/** Only a failure that came back quickly is retried, so one page never waits much past one timeout. */
const RETRY_IF_FAILED_WITHIN_MS = 4000;
const RETRY_TIMEOUT_MS = 5000;

class RetryableFailure extends Error {}

async function fetchOnce<T>(url: string, endpoint: string, revalidate: number, timeoutMs: number, tags?: string[]): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: apiHeaders(),
      signal: controller.signal,
      next: tags?.length ? { revalidate, tags } : { revalidate },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`[API Error] ${response.status} from ${url}`);
      if (RETRYABLE_STATUS.has(response.status)) throw new RetryableFailure(`HTTP ${response.status}`);
      throw new ApiUnavailableError(endpoint, `HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiUnavailableError || error instanceof RetryableFailure) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[API Fetch Failed] ${url}: ${detail}`);
    // A timeout is not retried (it already used the whole budget); other network errors are.
    if (controller.signal.aborted) throw new ApiUnavailableError(endpoint, detail);
    throw new RetryableFailure(detail);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Returns parsed JSON, `null` for a genuine 404, and throws ApiUnavailableError for
 * timeouts, network failures and other non-2xx answers. A quick passing failure
 * (429/502/503/504 or a dropped connection) is retried once before giving up.
 */
async function apiFetch<T>(endpoint: string, revalidate: number, tags?: string[]): Promise<T | null> {
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const started = Date.now();
  try {
    return await fetchOnce<T>(url, endpoint, revalidate, FETCH_TIMEOUT_MS, tags);
  } catch (error) {
    if (!(error instanceof RetryableFailure)) throw error;
    if (Date.now() - started > RETRY_IF_FAILED_WITHIN_MS) throw new ApiUnavailableError(endpoint, error.message);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    try {
      return await fetchOnce<T>(url, endpoint, revalidate, RETRY_TIMEOUT_MS, tags);
    } catch (retryError) {
      if (retryError instanceof RetryableFailure) throw new ApiUnavailableError(endpoint, retryError.message);
      throw retryError;
    }
  }
}

function clampPage(page?: number): number {
  return Math.min(1000, Math.max(1, Math.floor(Number(page) || 1)));
}

function clampPerPage(perPage?: number): number {
  return Math.min(50, Math.max(1, Math.floor(Number(perPage) || 20)));
}

function emptyPage<T>(page: number, perPage: number): PaginatedResponse<T> {
  return { data: [], meta: { current_page: page, last_page: 1, per_page: perPage, total: 0 } };
}

// -------------------------------------------------------------
// Jobs
// -------------------------------------------------------------
export async function getJobCategories(): Promise<JobCategory[]> {
  const res = await apiFetch<SingleResponse<JobCategory[]>>('/job-categories', REVALIDATE.taxonomy);
  return res?.data ?? [];
}

/** Categories for navigation chrome: never breaks a page when the API is down. */
export async function getJobCategoriesSafe(): Promise<JobCategory[]> {
  try {
    return await getJobCategories();
  } catch {
    return [];
  }
}

export interface GetJobsParams {
  category?: string;
  q?: string;
  page?: number;
  per_page?: number;
  recently_added?: boolean;
}

export function buildJobsQuery(params: GetJobsParams = {}): string {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.q && params.q.trim()) query.set('q', params.q.trim().slice(0, 100));
  if (params.recently_added) query.set('recently_added', '1');
  query.set('page', clampPage(params.page).toString());
  query.set('per_page', clampPerPage(params.per_page).toString());
  return query.toString();
}

export async function getJobs(params: GetJobsParams = {}): Promise<PaginatedResponse<JobListItem>> {
  const res = await apiFetch<PaginatedResponse<JobListItem>>(`/jobs?${buildJobsQuery(params)}`, REVALIDATE.jobs);
  return res ?? emptyPage(clampPage(params.page), clampPerPage(params.per_page));
}

/**
 * Detail for a published job, including ones whose deadline has passed (`availability`
 * tells which; old URLs keep working with an expired notice). `null` means the API
 * reports it as unavailable (draft, never published, or deleted).
 */
export async function getJobDetail(slugOrId: string): Promise<JobDetail | null> {
  const clean = slugOrId?.trim();
  if (!clean || clean.length > 255) return null;
  const res = await apiFetch<SingleResponse<JobDetail>>(`/jobs/${encodeURIComponent(clean)}?include_expired=1`, REVALIDATE.jobDetail);
  return res?.data ?? null;
}

/** Walks every page of the public job list (used by the sitemap). Throws rather than truncating. */
export async function getAllJobs(): Promise<JobListItem[]> {
  const all: JobListItem[] = [];
  let page = 1;
  let lastPage = 1;
  const MAX_PAGES = 1000;
  do {
    const res = await getJobs({ page, per_page: 50 });
    all.push(...res.data);
    lastPage = res.meta.last_page || 1;
    if (lastPage > MAX_PAGES) {
      throw new Error(`Public job list exceeds sitemap page cap: last_page is ${lastPage} (cap: ${MAX_PAGES})`);
    }
    page++;
  } while (page <= lastPage);
  return all;
}

// -------------------------------------------------------------
// Old (expired) circulars — website-only archive list, newest deadline first
// -------------------------------------------------------------
export interface GetOldJobsParams {
  category?: string;
  page?: number;
  per_page?: number;
}

/** `meta.listing_days` = how many days after the deadline a job stays in this list (admin setting). */
export type OldJobsResponse = PaginatedResponse<JobListItem> & { meta: { listing_days?: number } };

export async function getOldJobs(params: GetOldJobsParams = {}): Promise<OldJobsResponse> {
  const query = new URLSearchParams();
  query.set('availability', 'old');
  if (params.category && params.category !== 'all') query.set('category', params.category);
  query.set('page', clampPage(params.page).toString());
  query.set('per_page', clampPerPage(params.per_page).toString());
  const res = await apiFetch<OldJobsResponse>(`/jobs?${query.toString()}`, REVALIDATE.jobs);
  return res ?? emptyPage(clampPage(params.page), clampPerPage(params.per_page));
}

/** Every page of the old-jobs list (sitemap). Throws rather than truncating. */
export async function getAllOldJobs(): Promise<JobListItem[]> {
  const all: JobListItem[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await getOldJobs({ page, per_page: 50 });
    all.push(...res.data);
    lastPage = Math.min(res.meta.last_page || 1, 1000);
    page++;
  } while (page <= lastPage);
  return all;
}

/**
 * Every job that was ever published (active and any old one, without the /old-jobs time limit),
 * for the sitemap. `null` = this API build has no such endpoint yet (older Laravel).
 */
export async function getSitemapJobs(): Promise<SitemapJobItem[] | null> {
  const res = await apiFetch<{ data: SitemapJobItem[] }>('/sitemap/jobs', REVALIDATE.jobs);
  return res ? res.data : null;
}

// -------------------------------------------------------------
// Public sources directory
// -------------------------------------------------------------
export interface GetJobSourcesParams {
  category?: string;
  q?: string;
  page?: number;
  per_page?: number;
}

export async function getJobSources(params: GetJobSourcesParams = {}): Promise<PaginatedResponse<DirectorySourceItem>> {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.page && params.page > 1) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(Math.min(params.per_page, 50)));

  const qs = query.toString();
  const endpoint = `/sources${qs ? `?${qs}` : ''}`;
  const res = await apiFetch<PaginatedResponse<DirectorySourceItem>>(endpoint, REVALIDATE.sources);
  if (!res) {
    throw new ApiUnavailableError(endpoint, 'No response received from sources endpoint');
  }
  return res;
}

/** /sources পাতার জন্য: প্রতিটি প্রকাশিত চাকরি ও তার পাতায় দেখানো উৎস। */
export interface SourceJobItem {
  id: number;
  slug: string;
  title: string;
  organization_name: string | null;
  category: { slug: string; name: string } | null;
  circular_published_date: string | null;
  availability?: JobAvailability;
  sources: PublicJobSource[];
}

export type SourceGroup = 'official' | 'newspaper' | 'epaper' | 'saved_image';

export interface GetSourceJobsParams extends GetJobSourcesParams {
  group?: SourceGroup;
  verified?: boolean;
}

export async function getSourceJobs(params: GetSourceJobsParams = {}): Promise<PaginatedResponse<SourceJobItem>> {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.group) query.set('group', params.group);
  if (params.verified) query.set('verified', '1');
  if (params.page && params.page > 1) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(Math.min(params.per_page, 50)));

  const qs = query.toString();
  const endpoint = `/sources/jobs${qs ? `?${qs}` : ''}`;
  const res = await apiFetch<PaginatedResponse<SourceJobItem>>(endpoint, REVALIDATE.sources);
  if (!res) {
    throw new ApiUnavailableError(endpoint, 'No response received from source jobs endpoint');
  }
  return res;
}

// -------------------------------------------------------------
// Notices, exam schedules and results (separate from jobs)
// -------------------------------------------------------------
export interface GetNoticesParams {
  type?: NoticeType;
  kind?: NoticeKind;
  /** Exams/vivas that have not finished yet, nearest date first. */
  upcoming?: boolean;
  page?: number;
  per_page?: number;
}

export async function getNotices(params: GetNoticesParams = {}): Promise<PaginatedResponse<PublicNotice>> {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.kind) query.set('kind', params.kind);
  if (params.upcoming) query.set('upcoming', '1');
  query.set('page', clampPage(params.page).toString());
  query.set('per_page', clampPerPage(params.per_page).toString());
  const res = await apiFetch<PaginatedResponse<PublicNotice>>(`/notices?${query.toString()}`, REVALIDATE.notices, [CACHE_TAGS.notices]);
  return res ?? emptyPage(clampPage(params.page), clampPerPage(params.per_page));
}

/**
 * One published notice by slug ("42-bpsc-viva-schedule") or bare id. The API finds it by the
 * leading id, so an older slug still resolves (the page then redirects to the current one).
 * `null` = not published, unpublished or deleted. Throws when the API is unavailable.
 */
export async function getNoticeDetail(slugOrId: string): Promise<PublicNotice | null> {
  let clean = '';
  try {
    clean = decodeURIComponent(slugOrId ?? '').trim().toLowerCase();
  } catch {
    return null;
  }
  const id = /^(\d{1,10})(?:-[a-z0-9-]*)?$/.exec(clean)?.[1];
  if (!id) return null;
  // Requested by id: works on older API builds too, and one cache entry serves every slug variant.
  const res = await apiFetch<SingleResponse<PublicNotice>>(`/notices/${id}`, REVALIDATE.notices, [
    CACHE_TAGS.notices,
    CACHE_TAGS.notice(id),
  ]);
  return res?.data ?? null;
}

/** Every visible notice for the sitemap. `null` = this API build has no such endpoint yet. */
export async function getSitemapNotices(): Promise<SitemapNoticeItem[] | null> {
  const res = await apiFetch<{ data: SitemapNoticeItem[] }>('/sitemap/notices', REVALIDATE.notices, [CACHE_TAGS.notices]);
  return res ? res.data : null;
}

/** Home page strip: an outage or an older server simply hides the section. */
export async function getLatestNoticesSafe(limit = 5): Promise<PublicNotice[]> {
  try {
    return (await getNotices({ per_page: limit })).data;
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// Question bank (read-only revision mode)
// -------------------------------------------------------------
export async function getStudySubjects(): Promise<Subject[]> {
  const res = await apiFetch<SingleResponse<Subject[]>>('/study/subjects', REVALIDATE.study);
  return res?.data ?? [];
}

export async function getStudyCollections(): Promise<QuestionCollection[]> {
  const res = await apiFetch<SingleResponse<QuestionCollection[]>>('/study/collections', REVALIDATE.study);
  return res?.data ?? [];
}

export interface GetQuestionsParams {
  collection?: string;
  subject?: string;
  topic_id?: number;
  page?: number;
  per_page?: number;
}

export async function getStudyQuestions(params: GetQuestionsParams = {}): Promise<PaginatedResponse<Question>> {
  const query = new URLSearchParams();
  query.set('mode', 'study'); // answers and explanations for public reading
  if (params.collection) query.set('collection', params.collection);
  if (params.subject) query.set('subject', params.subject);
  if (params.topic_id) query.set('topic_id', params.topic_id.toString());
  const page = clampPage(params.page);
  const perPage = clampPerPage(params.per_page);
  query.set('page', page.toString());
  query.set('per_page', perPage.toString());

  const res = await apiFetch<PaginatedResponse<Question>>(`/study/questions?${query.toString()}`, REVALIDATE.study);
  if (!res) return emptyPage(page, perPage);
  // The study endpoint's meta has no per_page; keep numbering stable.
  return { ...res, meta: { ...res.meta, per_page: res.meta.per_page ?? perPage } };
}

// -------------------------------------------------------------
// Current affairs (general knowledge)
// -------------------------------------------------------------
export interface GetCurrentAffairsParams {
  page?: number;
  per_page?: number;
}

export async function getCurrentAffairs(params: GetCurrentAffairsParams = {}): Promise<PaginatedResponse<CurrentAffair>> {
  const page = clampPage(params.page);
  const perPage = clampPerPage(params.per_page);
  const res = await apiFetch<PaginatedResponse<CurrentAffair>>(
    `/current-affairs?page=${page}&per_page=${perPage}`,
    REVALIDATE.study,
  );
  if (!res) return emptyPage(page, perPage);
  return { ...res, meta: { ...res.meta, per_page: res.meta.per_page ?? perPage } };
}
