// File: lib/api.ts
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

const DEFAULT_SITE_URL = 'https://dailyjobs.bd';
const DEFAULT_API_BASE_URL = 'https://jobs.kazitechsolutions.com/api/v1';
const REVALIDATE_SECONDS = 60;
const FETCH_TIMEOUT_MS = 8000;

export function getSiteUrl(): string {
  const url = process.env.SITE_URL || DEFAULT_SITE_URL;
  return url.replace(/\/+$/, '');
}

function getApiBaseUrl(): string {
  const url = process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
  return url.replace(/\/+$/, '');
}

async function apiFetch<T>(endpoint: string, options?: { revalidate?: number; init?: RequestInit }): Promise<T | null> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const revalidate = options?.revalidate !== undefined ? options.revalidate : REVALIDATE_SECONDS;
    const fetchOptions: RequestInit = {
      ...options?.init,
      headers: {
        Accept: 'application/json',
        ...(options?.init?.headers || {}),
      },
      signal: controller.signal,
      next: { revalidate },
    };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(`[API Error] ${response.status} from ${url}`);
      return null;
    }

    const json = await response.json();
    return json as T;
  } catch (error) {
    console.error(`[API Fetch Failed] ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

// -------------------------------------------------------------
// Job Categories
// -------------------------------------------------------------
export async function getJobCategories(): Promise<JobCategory[]> {
  const res = await apiFetch<SingleResponse<JobCategory[]>>('/job-categories');
  return res?.data || [];
}

// -------------------------------------------------------------
// Jobs List
// -------------------------------------------------------------
export interface GetJobsParams {
  category?: string;
  q?: string;
  page?: number;
  per_page?: number;
  recently_added?: boolean;
}

export async function getJobs(params: GetJobsParams = {}): Promise<PaginatedResponse<JobListItem>> {
  const query = new URLSearchParams();

  // If category is provided and not 'all', add to query
  if (params.category && params.category !== 'all') {
    query.set('category', params.category);
  }

  // Laravel expects 'q' for text search
  if (params.q && params.q.trim()) {
    query.set('q', params.q.trim());
  }

  if (params.recently_added) {
    query.set('recently_added', '1');
  }

  const page = Math.max(1, Number(params.page) || 1);
  query.set('page', page.toString());

  // Cap per_page at 50 per Laravel validation
  const perPage = Math.min(50, Math.max(1, Number(params.per_page) || 20));
  query.set('per_page', perPage.toString());

  const res = await apiFetch<PaginatedResponse<JobListItem>>(`/jobs?${query.toString()}`);

  if (!res) {
    return {
      data: [],
      meta: {
        current_page: page,
        last_page: 1,
        per_page: perPage,
        total: 0,
      },
    };
  }

  return res;
}

// -------------------------------------------------------------
// Job Detail
// -------------------------------------------------------------
export async function getJobDetail(slugOrId: string): Promise<JobDetail | null> {
  if (!slugOrId) return null;
  const cleanParam = encodeURIComponent(slugOrId.trim());
  const res = await apiFetch<SingleResponse<JobDetail>>(`/jobs/${cleanParam}`);
  return res?.data || null;
}

// -------------------------------------------------------------
// Study Zone: Subjects & Topics
// -------------------------------------------------------------
export async function getStudySubjects(): Promise<Subject[]> {
  const res = await apiFetch<SingleResponse<Subject[]>>('/study/subjects');
  return res?.data || [];
}

// -------------------------------------------------------------
// Study Zone: Collections
// -------------------------------------------------------------
export async function getStudyCollections(): Promise<QuestionCollection[]> {
  const res = await apiFetch<SingleResponse<QuestionCollection[]>>('/study/collections');
  return res?.data || [];
}

// -------------------------------------------------------------
// Study Zone: Questions (Revision Mode with Answers)
// -------------------------------------------------------------
export interface GetQuestionsParams {
  collection?: string;
  subject?: string;
  topic_id?: number;
  page?: number;
  per_page?: number;
}

export async function getStudyQuestions(params: GetQuestionsParams = {}): Promise<PaginatedResponse<Question>> {
  const query = new URLSearchParams();
  query.set('mode', 'study'); // Always fetch with answers and explanations for public reading

  if (params.collection) {
    query.set('collection', params.collection);
  }

  if (params.subject) {
    query.set('subject', params.subject);
  }

  if (params.topic_id) {
    query.set('topic_id', params.topic_id.toString());
  }

  const page = Math.max(1, Number(params.page) || 1);
  query.set('page', page.toString());

  const perPage = Math.min(50, Math.max(1, Number(params.per_page) || 20));
  query.set('per_page', perPage.toString());

  const res = await apiFetch<PaginatedResponse<Question>>(`/study/questions?${query.toString()}`);

  if (!res) {
    return {
      data: [],
      meta: {
        current_page: page,
        last_page: 1,
        per_page: perPage,
        total: 0,
      },
    };
  }

  return res;
}

// -------------------------------------------------------------
// Study Zone: Current Affairs
// -------------------------------------------------------------
export interface GetCurrentAffairsParams {
  page?: number;
  per_page?: number;
  from?: string;
  to?: string;
  category?: string;
}

export async function getCurrentAffairs(params: GetCurrentAffairsParams = {}): Promise<PaginatedResponse<CurrentAffair>> {
  const query = new URLSearchParams();

  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.category) query.set('category', params.category);

  const page = Math.max(1, Number(params.page) || 1);
  query.set('page', page.toString());

  const perPage = Math.min(50, Math.max(1, Number(params.per_page) || 20));
  query.set('per_page', perPage.toString());

  const res = await apiFetch<PaginatedResponse<CurrentAffair>>(`/current-affairs?${query.toString()}`);

  if (!res) {
    return {
      data: [],
      meta: {
        current_page: page,
        last_page: 1,
        per_page: perPage,
        total: 0,
      },
    };
  }

  return res;
}
