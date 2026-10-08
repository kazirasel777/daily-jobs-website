// File: lib/api.ts
// Server-only data layer for the Laravel public API (/api/v1).
// "Not found" (404) and "API unavailable" are kept apart so an outage is never
// published as an empty listing or a permanent 404.
import type {
  JobCategory,
  JobListItem,
  JobDetail,
  PaginatedResponse,
  SingleResponse,
  Subject,
  QuestionCollection,
  Question,
  CurrentAffair,
} from '@/types/job';

const DEFAULT_API_BASE_URL = 'https://jobs.kazitechsolutions.com/api/v1';
const FETCH_TIMEOUT_MS = 8000;

/** Seconds a cached API response may be reused before it is refreshed in the background. */
export const REVALIDATE = {
  jobs: 120,
  jobDetail: 300,
  taxonomy: 3600,
  study: 900,
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

/**
 * Returns parsed JSON, `null` for a genuine 404, and throws ApiUnavailableError for
 * timeouts, network failures and other non-2xx answers.
 */
async function apiFetch<T>(endpoint: string, revalidate: number): Promise<T | null> {
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      next: { revalidate },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`[API Error] ${response.status} from ${url}`);
      throw new ApiUnavailableError(endpoint, `HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiUnavailableError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[API Fetch Failed] ${url}: ${detail}`);
    throw new ApiUnavailableError(endpoint, detail);
  } finally {
    clearTimeout(timeoutId);
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
 * Detail for a published, not-yet-expired job. `null` means the API reports it as
 * unavailable (draft, expired or deleted — the API does not say which).
 */
export async function getJobDetail(slugOrId: string): Promise<JobDetail | null> {
  const clean = slugOrId?.trim();
  if (!clean || clean.length > 255) return null;
  const res = await apiFetch<SingleResponse<JobDetail>>(`/jobs/${encodeURIComponent(clean)}`, REVALIDATE.jobDetail);
  return res?.data ?? null;
}

/** Walks every page of the public job list (used by the sitemap). Throws rather than truncating. */
export async function getAllJobs(): Promise<JobListItem[]> {
  const all: JobListItem[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const res = await getJobs({ page, per_page: 50 });
    all.push(...res.data);
    lastPage = res.meta.last_page || 1;
    page++;
  } while (page <= lastPage && page <= 1000);
  return all;
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
