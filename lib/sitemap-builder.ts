// File: lib/sitemap-builder.ts
// Core production sitemap generation, bounded freshness, and resilience logic.
// Separated from the Next.js route entrypoint so it can be tested directly and
// reliably without framework-internal mocks.
import type { MetadataRoute } from 'next';
import type { JobCategory, JobListItem, QuestionCollection, Subject } from '@/types/job';

/** Target revalidation interval for search engine discovery (15 minutes). */
export const SITEMAP_REVALIDATE_SECONDS = 900;

/**
 * Maximum allowable age of a stale snapshot before it is considered expired (24 hours).
 * Stale-while-revalidate must not serve severely outdated data indefinitely.
 */
export const MAX_STALE_AGE_MS = 24 * 60 * 60 * 1000;

/** Threshold below which study questions, subjects, and collections remain unindexed. */
export const MIN_INDEXABLE_QUESTIONS = 10;

export interface StudySitemapData {
  subjects: Array<Pick<Subject, 'slug' | 'question_count'>>;
  collections: Array<Pick<QuestionCollection, 'slug' | 'question_count'>>;
  questionTotal: number;
  affairsTotal: number;
  affairsLatestDate: string | null;
  updatedAt: number;
}

export interface SitemapPayload {
  entries: MetadataRoute.Sitemap;
  /** Actual timestamp when the data was successfully fetched from the primary upstream API. */
  generatedAt: number;
}

export interface SitemapCacheEntry<T> {
  data: T;
  createdAt: number;
}

export interface SitemapCacheAdapter {
  get<T>(key: string): Promise<SitemapCacheEntry<T> | null>;
  set<T>(key: string, data: T, createdAt: number): Promise<void>;
}

/** In-memory cache adapter for process-level fallback and test verification. */
export class MemoryCacheAdapter implements SitemapCacheAdapter {
  private store = new Map<string, SitemapCacheEntry<unknown>>();

  async get<T>(key: string): Promise<SitemapCacheEntry<T> | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry as SitemapCacheEntry<T>;
  }

  async set<T>(key: string, data: T, createdAt: number): Promise<void> {
    this.store.set(key, { data, createdAt });
  }

  clear(): void {
    this.store.clear();
  }
}

export function validDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function latest(dates: (Date | undefined)[]): Date | undefined {
  return dates.reduce<Date | undefined>((max, d) => (d && (!max || d > max) ? d : max), undefined);
}

export interface BuildSitemapDataParams {
  jobs: JobListItem[];
  categories: JobCategory[];
  studyData?: StudySitemapData | null;
  siteUrl?: string;
}

/**
 * Pure generator: constructs the sitemap URL array from in-memory inputs.
 * If jobs is empty (genuine 0 published jobs from API), static pages and other
 * eligible content are still emitted as a valid sitemap.
 */
export function buildSitemapData({
  jobs,
  categories,
  studyData,
  siteUrl = 'https://dailyjobs.bd',
}: BuildSitemapDataParams): MetadataRoute.Sitemap {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const toUrl = (path: string) => `${cleanSiteUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const entries: MetadataRoute.Sitemap = [];

  // Home page: last change is the newest published job (omitted if no published jobs)
  entries.push({
    url: toUrl('/'),
    ...(jobs.length > 0 ? { lastModified: latest(jobs.map((j) => validDate(j.published_at))) } : {}),
  });

  // Categories with at least one active job (in-memory filtering: 0 extra API calls)
  for (const c of categories) {
    const categoryJobs = jobs.filter((j) => j.category?.slug === c.slug);
    if (categoryJobs.length === 0) continue;
    const newest = latest(categoryJobs.map((j) => validDate(j.published_at)));
    entries.push({
      url: toUrl(`/category/${c.slug}`),
      ...(newest ? { lastModified: newest } : {}),
    });
  }

  // Job detail pages
  for (const job of jobs) {
    const modified = validDate(job.updated_at) ?? validDate(job.published_at);
    entries.push({
      url: toUrl(`/job/${job.slug || job.id}`),
      ...(modified ? { lastModified: modified } : {}),
    });
  }

  // Study pages follow the threshold (MIN_INDEXABLE_QUESTIONS = 10)
  if (studyData) {
    if (studyData.questionTotal >= MIN_INDEXABLE_QUESTIONS) {
      entries.push({ url: toUrl('/question-bank') });
    }
    studyData.subjects
      .filter((s) => s.question_count >= MIN_INDEXABLE_QUESTIONS)
      .forEach((s) => entries.push({ url: toUrl(`/question-bank/subject/${s.slug}`) }));
    studyData.collections
      .filter((c) => c.question_count >= MIN_INDEXABLE_QUESTIONS)
      .forEach((c) => entries.push({ url: toUrl(`/question-bank/set/${c.slug}`) }));

    if (studyData.affairsTotal >= MIN_INDEXABLE_QUESTIONS) {
      entries.push({
        url: toUrl('/current-affairs'),
        ...(studyData.affairsLatestDate ? { lastModified: validDate(studyData.affairsLatestDate) } : {}),
      });
    }
  }

  // Static informational pages are always indexable, even if jobs = 0
  for (const path of ['/about', '/contact', '/privacy', '/disclaimer', '/sources']) {
    entries.push({ url: toUrl(path) });
  }

  return entries;
}

export const STUDY_CACHE_KEY = 'dailyjobs-study-sitemap-v1';

/**
 * Fetches live study data across endpoints.
 * Throws an explicit error if any endpoint fails so Next.js unstable_cache does NOT
 * overwrite valid cached data during background revalidation.
 */
export async function fetchLiveStudySitemapData({
  fetchStudySubjects,
  fetchStudyCollections,
  fetchStudyQuestions,
  fetchCurrentAffairs,
}: {
  fetchStudySubjects: () => Promise<Subject[]>;
  fetchStudyCollections: () => Promise<QuestionCollection[]>;
  fetchStudyQuestions: () => Promise<{ meta: { total: number } }>;
  fetchCurrentAffairs: () => Promise<{ data: Array<{ affair_date?: string | null }>; meta: { total: number } }>;
}): Promise<StudySitemapData> {
  const [subjectsRes, collectionsRes, questionsRes, affairsRes] = await Promise.allSettled([
    fetchStudySubjects(),
    fetchStudyCollections(),
    fetchStudyQuestions(),
    fetchCurrentAffairs(),
  ]);

  const failures = [subjectsRes, collectionsRes, questionsRes, affairsRes].filter(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  );

  if (failures.length > 0) {
    const errorDetails = failures.map((f) => f.reason?.message || String(f.reason)).join(', ');
    throw new Error(`Optional study endpoints failed (${failures.length} errors): ${errorDetails}`);
  }

  return {
    subjects: (subjectsRes as PromiseFulfilledResult<Subject[]>).value,
    collections: (collectionsRes as PromiseFulfilledResult<QuestionCollection[]>).value,
    questionTotal: (questionsRes as PromiseFulfilledResult<{ meta: { total: number } }>).value.meta.total,
    affairsTotal: (affairsRes as PromiseFulfilledResult<{ meta: { total: number } }>).value.meta.total,
    affairsLatestDate:
      (affairsRes as PromiseFulfilledResult<{ data: Array<{ affair_date?: string | null }> }>).value.data[0]
        ?.affair_date ?? null,
    updatedAt: Date.now(),
  };
}

export interface ResolveStudyDataParams {
  fetchLiveStudy: () => Promise<StudySitemapData>;
  cache?: SitemapCacheAdapter | null;
  now?: number;
  maxStaleAgeMs?: number;
}

/**
 * Resolves study metadata.
 * Evaluates study data age using its true updatedAt timestamp.
 * If fetchLiveStudy returns an expired snapshot or fails with an expired cache,
 * the outdated study data is omitted while jobs discovery continues normally.
 * When saving to cache, preserves the true updatedAt timestamp to avoid resetting age.
 */
export async function resolveStudySitemapData({
  fetchLiveStudy,
  cache = null,
  now = Date.now(),
  maxStaleAgeMs = MAX_STALE_AGE_MS,
}: ResolveStudyDataParams): Promise<StudySitemapData> {
  const emptyStudyData: StudySitemapData = {
    subjects: [],
    collections: [],
    questionTotal: 0,
    affairsTotal: 0,
    affairsLatestDate: null,
    updatedAt: now,
  };

  try {
    const studyData = await fetchLiveStudy();
    // 1. Verify study data age using its actual updatedAt timestamp
    const actualTimestamp = typeof studyData.updatedAt === 'number' ? studyData.updatedAt : now;
    const age = now - actualTimestamp;

    if (age > maxStaleAgeMs) {
      console.warn(
        `[Sitemap] Received study snapshot is expired: age ${Math.round(age / 1000)}s > max ${Math.round(
          maxStaleAgeMs / 1000
        )}s. Omission to keep jobs discovery clean.`
      );
      // Exceeded allowable age: omit outdated study data; jobs sitemap remains active
      return emptyStudyData;
    }

    // 2. Preserve original timestamp when storing in cache (do not reset age to now!)
    if (cache) {
      await cache.set(STUDY_CACHE_KEY, studyData, actualTimestamp).catch(() => {});
    }

    return {
      ...studyData,
      updatedAt: actualTimestamp,
    };
  } catch (err) {
    console.warn('[Sitemap] Live study fetch failed. Checking durable cache for fallback snapshot...', err);
    if (cache) {
      const cached = await cache.get<StudySitemapData>(STUDY_CACHE_KEY).catch(() => null);
      if (cached) {
        const actualTimestamp =
          typeof cached.data?.updatedAt === 'number' ? cached.data.updatedAt : cached.createdAt;
        const age = now - actualTimestamp;
        if (age <= maxStaleAgeMs) {
          console.warn('[Sitemap] Reusing cached study snapshot within allowable age.');
          return {
            ...cached.data,
            updatedAt: actualTimestamp,
          };
        } else {
          console.warn(
            `[Sitemap] Cached study snapshot expired: age ${Math.round(age / 1000)}s > max ${Math.round(
              maxStaleAgeMs / 1000
            )}s.`
          );
        }
      }
    }
    // Cold start with no cache or expired: return empty study data without failing jobs discovery
    return emptyStudyData;
  }
}


export interface GenerateSitemapParams {
  fetchJobs: () => Promise<JobListItem[]>;
  fetchCategories: () => Promise<JobCategory[]>;
  fetchStudyData?: () => Promise<StudySitemapData>;
  cache?: SitemapCacheAdapter | null;
  siteUrl?: string;
  now?: number;
  maxStaleAgeMs?: number;
}

export const SITEMAP_CACHE_KEY = 'dailyjobs-sitemap-v2';

/**
 * Production sitemap orchestrator.
 * Distinguishes genuine zero-job results from API failures.
 * On API failure: uses durable cache fallback if age <= maxStaleAgeMs; otherwise throws honest error.
 * Preserves the original generation timestamp so fallback data does not reset its age to zero.
 */
export async function generateSitemapWithResilience({
  fetchJobs,
  fetchCategories,
  fetchStudyData,
  cache = null,
  siteUrl,
  now = Date.now(),
  maxStaleAgeMs = MAX_STALE_AGE_MS,
}: GenerateSitemapParams): Promise<SitemapPayload> {
  try {
    // 1. Mandatory Core: Fetch jobs
    // If API is down / network fails -> throws ApiUnavailableError (caught below)
    // If API succeeds with 0 jobs -> returns [] (valid empty array, handled cleanly)
    const jobs = await fetchJobs();

    // 2. Fetch categories (Safe: falls back to extracting unique categories from jobs if taxonomy API fails)
    let categories: JobCategory[] = [];
    try {
      categories = await fetchCategories();
    } catch {
      categories = [];
    }
    if (categories.length === 0 && jobs.length > 0) {
      const catMap = new Map<string, JobCategory>();
      for (const j of jobs) {
        if (j.category?.slug && j.category?.name) {
          catMap.set(j.category.slug, j.category);
        }
      }
      categories = Array.from(catMap.values());
    }

    // 3. Optional study data
    let studyData: StudySitemapData | null = null;
    if (fetchStudyData) {
      try {
        studyData = await fetchStudyData();
      } catch (err) {
        console.warn('[Sitemap] Study data resolver failed:', err);
      }
    }

    // 4. Build sitemap entries
    const entries = buildSitemapData({
      jobs,
      categories,
      studyData,
      siteUrl,
    });

    const payload: SitemapPayload = {
      entries,
      generatedAt: now, // True successful generation timestamp
    };

    // 5. Store successful sitemap in durable cache with generation timestamp
    if (cache) {
      await cache.set(SITEMAP_CACHE_KEY, payload, now).catch(() => {});
    }

    return payload;
  } catch (error) {
    // Jobs API failed! Check cache for fallback snapshot
    if (cache) {
      const cached = await cache.get<SitemapPayload>(SITEMAP_CACHE_KEY).catch(() => null);
      if (cached) {
        const payload = cached.data;
        // CRITICAL: Preserve the original generatedAt timestamp of the snapshot!
        const originalGeneratedAt =
          typeof payload.generatedAt === 'number' ? payload.generatedAt : cached.createdAt;
        const age = now - originalGeneratedAt;

        if (age <= maxStaleAgeMs) {
          console.warn(
            `[Sitemap] Jobs API failed; serving cached sitemap snapshot (age: ${Math.round(
              age / 1000
            )}s, generatedAt: ${originalGeneratedAt}).`
          );
          // Return the payload with the ORIGINAL generatedAt! DO NOT reset age to 0!
          return {
            entries: payload.entries,
            generatedAt: originalGeneratedAt,
          };
        } else {
          console.error(
            `[Sitemap] Cached snapshot expired (age: ${Math.round(age / 1000)}s > max: ${Math.round(
              maxStaleAgeMs / 1000
            )}s). Aborting fallback.`
          );
          throw new Error(`Sitemap snapshot expired: age ${age}ms exceeds maximum allowed ${maxStaleAgeMs}ms`);
        }
      }
    }

    // Cold start with no cache or expired snapshot: rethrow honest retryable error
    throw error;
  }
}

/**
 * Route-level handler: verifies the actual age of the cached payload before returning.
 * Ensures that even if the framework cache served stale data, snapshots exceeding
 * MAX_STALE_AGE_MS are strictly rejected.
 */
export async function handleSitemapRoute({
  fetchPayload,
  now = Date.now(),
  maxStaleAgeMs = MAX_STALE_AGE_MS,
}: {
  fetchPayload: () => Promise<SitemapPayload>;
  now?: number;
  maxStaleAgeMs?: number;
}): Promise<MetadataRoute.Sitemap> {
  const payload = await fetchPayload();
  const age = now - payload.generatedAt;

  if (age > maxStaleAgeMs) {
    console.error(
      `[Sitemap Route] Cached sitemap payload expired: age ${Math.round(age / 1000)}s exceeds maximum allowed ${Math.round(
        maxStaleAgeMs / 1000
      )}s.`
    );
    throw new Error(`Sitemap payload expired: age ${age}ms exceeds maximum allowable ${maxStaleAgeMs}ms`);
  }

  return payload.entries.map((entry) => ({
    ...entry,
    ...(entry.lastModified ? { lastModified: new Date(entry.lastModified) } : {}),
  }));
}
