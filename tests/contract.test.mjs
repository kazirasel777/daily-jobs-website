// File: tests/contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

// Helper simulating URL query builder logic in lib/api.ts
function buildJobsQuery(params) {
  const query = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    query.set('category', params.category);
  }

  if (params.q && params.q.trim()) {
    query.set('q', params.q.trim());
  }

  if (params.recently_added) {
    query.set('recently_added', '1');
  }

  const page = Math.max(1, Number(params.page) || 1);
  query.set('page', page.toString());

  const perPage = Math.min(50, Math.max(1, Number(params.per_page) || 20));
  query.set('per_page', perPage.toString());

  return query.toString();
}

test('API query builder omits category when "all" is selected', () => {
  const query = buildJobsQuery({ category: 'all', page: 1 });
  assert.equal(query.includes('category=all'), false);
  assert.equal(query.includes('page=1'), true);
  assert.equal(query.includes('per_page=20'), true);
});

test('API query builder correctly includes valid seeded category slug', () => {
  const query = buildJobsQuery({ category: 'govt_jobs', page: 2 });
  assert.equal(query.includes('category=govt_jobs'), true);
  assert.equal(query.includes('page=2'), true);
});

test('API query builder encodes search term as parameter "q"', () => {
  const query = buildJobsQuery({ q: 'শিক্ষক নিয়োগ' });
  assert.equal(query.includes('q=%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%95+%E0%A6%A8%E0%A6%BF%E0%A6%AF%E0%A6%BC%E0%A7%8B%E0%A6%97'), true);
});

test('API query builder caps per_page at 50 to avoid Laravel 422 validation errors', () => {
  const query = buildJobsQuery({ per_page: 100 });
  assert.equal(query.includes('per_page=50'), true);
  assert.equal(query.includes('per_page=100'), false);
});

function buildSourcesQuery(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.q?.trim()) query.set('q', params.q.trim());
  if (params.page && params.page > 1) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(Math.min(params.per_page, 50)));
  return query.toString();
}

test('Sources API query builder omits category when "all" is selected and filters category correctly', () => {
  const queryAll = buildSourcesQuery({ category: 'all' });
  assert.equal(queryAll.includes('category'), false);

  const queryGovt = buildSourcesQuery({ category: 'govt_jobs', page: 2 });
  assert.equal(queryGovt.includes('category=govt_jobs'), true);
  assert.equal(queryGovt.includes('page=2'), true);
});

test('Sources API query builder caps per_page at 50 and handles search query', () => {
  const query = buildSourcesQuery({ q: 'বিপিএসসি', per_page: 100 });
  assert.equal(query.includes('per_page=50'), true);
  assert.equal(new URLSearchParams(query).get('q'), 'বিপিএসসি');
});

// Sitemap date validation simulation
function parseValidDate(dateValue) {
  if (!dateValue) return undefined;
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

test('Sitemap date parser returns valid Date for ISO timestamp', () => {
  const parsed = parseValidDate('2026-03-15T10:30:00Z');
  assert.ok(parsed instanceof Date);
  assert.equal(parsed.toISOString(), '2026-03-15T10:30:00.000Z');
});

test('Sitemap date parser returns undefined for null, empty, or invalid date', () => {
  assert.equal(parseValidDate(null), undefined);
  assert.equal(parseValidDate(''), undefined);
  assert.equal(parseValidDate('not-a-real-date'), undefined);
});

test('Sitemap job entry omits lastModified when date is missing or invalid', () => {
  const baseUrl = 'https://dailyjobs.bd';
  const job = { id: 12, slug: 'test-job', published_at: null };
  const validDate = parseValidDate(job.published_at);

  const entry = {
    url: `${baseUrl}/job/${job.slug || job.id}`,
    changeFrequency: 'daily',
    priority: 0.8,
  };
  if (validDate) {
    entry.lastModified = validDate;
  }

  assert.equal(entry.url, 'https://dailyjobs.bd/job/test-job');
  assert.equal(entry.lastModified, undefined);
  assert.equal('lastModified' in entry, false);
});

test('Sitemap job entry includes valid lastModified when published_at is valid ISO string', () => {
  const baseUrl = 'https://dailyjobs.bd';
  const job = { id: 15, slug: 'govt-officer', published_at: '2026-03-20T08:00:00Z' };
  const validDate = parseValidDate(job.published_at);

  const entry = {
    url: `${baseUrl}/job/${job.slug || job.id}`,
    changeFrequency: 'daily',
    priority: 0.8,
  };
  if (validDate) {
    entry.lastModified = validDate;
  }

  assert.equal(entry.url, 'https://dailyjobs.bd/job/govt-officer');
  assert.ok(entry.lastModified instanceof Date);
  assert.equal(entry.lastModified.toISOString(), '2026-03-20T08:00:00.000Z');
});

// JobPosting validation logic simulation for contract tests
function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getValidJobPostingSchema(job) {
  const orgName = job.organization_name?.trim();
  if (!orgName || /dailyjobs|দৈনিক\s*চাকরি/i.test(orgName)) {
    return null;
  }
  const location = job.location?.trim();
  if (!location) {
    return null;
  }
  if (job.days_left !== null && job.days_left < 0) {
    return null;
  }
  if (!job.deadline) {
    return null;
  }
  const validThroughDate = new Date(`${job.deadline}T23:59:59+06:00`);
  if (isNaN(validThroughDate.getTime()) || validThroughDate.getTime() < Date.now()) {
    return null;
  }
  const title = (job.title || '').trim();
  const multiPostPatterns = /বিভিন্ন\s*পদ|একাধিক\s*পদ|বহু\s*পদ/i;
  if (multiPostPatterns.test(title)) {
    return null;
  }
  const cleanDesc = stripHtml(job.description || '').trim();
  if (cleanDesc.length < 60) {
    return null;
  }
  const rawDate = job.published_at || job.circular_published_date;
  if (!rawDate) {
    return null;
  }
  const postedDate = new Date(rawDate);
  if (isNaN(postedDate.getTime())) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: title,
    description: cleanDesc,
    datePosted: postedDate.toISOString(),
    validThrough: validThroughDate.toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: orgName,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: location,
        addressCountry: 'BD',
      },
    },
  };
}

test('JobPosting validator accepts eligible single job and rejects speculative fields', () => {
  const futureDeadline = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
  const eligibleJob = {
    title: 'চিফ হিউম্যান রিসোর্স অফিসার (CHRO)',
    organization_name: 'নর্থ সাউথ বিশ্ববিদ্যালয়',
    location: 'ঢাকা',
    days_left: 5,
    deadline: futureDeadline,
    published_at: '2026-09-20T10:00:00Z',
    description: '<p>নর্থ সাউথ বিশ্ববিদ্যালয়ে চিফ হিউম্যান রিসোর্স অফিসার পদে অভিজ্ঞতা সম্পন্ন প্রার্থী আবশ্যক। প্রার্থীর অবশ্যই সংশ্লিষ্ট ক্ষেত্রে অন্তত ১০ বছরের অভিজ্ঞতা থাকতে হবে।</p>',
  };

  const schema = getValidJobPostingSchema(eligibleJob);
  assert.ok(schema !== null);
  assert.equal(schema['@type'], 'JobPosting');
  assert.equal(schema.hiringOrganization.name, 'নর্থ সাউথ বিশ্ববিদ্যালয়');
  assert.equal(schema.jobLocation.address.addressLocality, 'ঢাকা');
  assert.equal('directApply' in schema, false, 'Must not assume directApply');
  assert.equal('employmentType' in schema, false, 'Must not assume employmentType');
});

test('JobPosting validator rejects multi-role circulars ("বিভিন্ন পদে")', () => {
  const futureDeadline = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
  const multiJob = {
    title: 'কর অঞ্চল-১৬ ঢাকায় বিভিন্ন পদে ৫৯ জন নিয়োগ',
    organization_name: 'কর অঞ্চল-১৬, ঢাকা',
    location: 'ঢাকা',
    days_left: 5,
    deadline: futureDeadline,
    published_at: '2026-09-20T10:00:00Z',
    description: '<p>কর অঞ্চল-১৬ ঢাকায় বিভিন্ন পদে নিয়োগ বিজ্ঞপ্তি প্রকাশ করা হয়েছে। যোগ্য প্রার্থীদের আবেদন করতে বলা যাচ্ছে।</p>',
  };

  assert.equal(getValidJobPostingSchema(multiJob), null);
});

test('JobPosting validator rejects placeholder/missing employer', () => {
  const futureDeadline = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
  const noEmployer = {
    title: 'হিসাবরক্ষক পদে নিয়োগ',
    organization_name: 'দৈনিক চাকরি',
    location: 'ঢাকা',
    days_left: 5,
    deadline: futureDeadline,
    published_at: '2026-09-20T10:00:00Z',
    description: '<p>হিসাবরক্ষক পদে অভিজ্ঞতা সম্পন্ন প্রার্থী আবশ্যক। যোগ্য প্রার্থীদের দ্রুত আবেদন করার আহ্বান জানানো হচ্ছে।</p>',
  };

  assert.equal(getValidJobPostingSchema(noEmployer), null);
});

test('JobPosting validator rejects expired jobs', () => {
  const expiredJob = {
    title: 'হিসাবরক্ষক পদে নিয়োগ',
    organization_name: 'এবিসি কোম্পানি',
    location: 'ঢাকা',
    days_left: -1,
    deadline: '2026-01-01',
    published_at: '2025-12-01T10:00:00Z',
    description: '<p>হিসাবরক্ষক পদে অভিজ্ঞতা সম্পন্ন প্রার্থী আবশ্যক। যোগ্য প্রার্থীদের দ্রুত আবেদন করার আহ্বান জানানো হচ্ছে।</p>',
  };

  assert.equal(getValidJobPostingSchema(expiredJob), null);
});

test('JobPosting validator rejects short or missing descriptions', () => {
  const futureDeadline = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
  const shortDescJob = {
    title: 'হিসাবরক্ষক পদে নিয়োগ',
    organization_name: 'এবিসি কোম্পানি',
    location: 'ঢাকা',
    days_left: 5,
    deadline: futureDeadline,
    published_at: '2026-09-20T10:00:00Z',
    description: '<p>বিজ্ঞপ্তি দেখুন।</p>',
  };

  assert.equal(getValidJobPostingSchema(shortDescJob), null);
});

test('JobPosting JSON-LD safely escapes < characters in HTML output', () => {
  const sample = { title: 'Tester <script>alert(1)</script>' };
  const serialized = JSON.stringify(sample).replace(/</g, '\\u003c');
  assert.equal(serialized.includes('<script>'), false);
  assert.equal(serialized.includes('\\u003cscript>'), true);
});

// ---------------------------------------------------------------------------
// Production Sitemap Failure-Path & Hardening Contract Tests
// Direct unit & resilience testing of lib/sitemap-builder.ts
// ---------------------------------------------------------------------------
import {
  resolveStudySitemapData,
  generateSitemapWithResilience,
  handleSitemapRoute,
  MemoryCacheAdapter,
  MAX_STALE_AGE_MS,
  SITEMAP_CACHE_KEY,
} from '../lib/sitemap-builder.ts';

test('Route handler (handleSitemapRoute): returns sitemap with Date instances when payload is within MAX_STALE_AGE_MS', async () => {
  const now = 10_000_000;
  const mockPayload = {
    entries: [
      { url: 'https://dailyjobs.bd/', lastModified: '2026-10-17T12:00:00.000Z' },
      { url: 'https://dailyjobs.bd/about' },
    ],
    generatedAt: now - 300_000, // 5 minutes old (well within 24h)
  };

  const result = await handleSitemapRoute({
    fetchPayload: async () => mockPayload,
    now,
    maxStaleAgeMs: MAX_STALE_AGE_MS,
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].url, 'https://dailyjobs.bd/');
  assert.ok(result[0].lastModified instanceof Date, 'Must convert ISO string to Date instance');
  assert.equal(result[0].lastModified.toISOString(), '2026-10-17T12:00:00.000Z');
  assert.equal(result[1].lastModified, undefined);
});

test('Route handler (handleSitemapRoute): rejects cached payload when age exceeds MAX_STALE_AGE_MS', async () => {
  const now = 100_000_000;
  const expiredPayload = {
    entries: [{ url: 'https://dailyjobs.bd/' }],
    generatedAt: now - (MAX_STALE_AGE_MS + 60_000), // 24h + 1m old
  };

  await assert.rejects(
    async () => {
      await handleSitemapRoute({
        fetchPayload: async () => expiredPayload,
        now,
        maxStaleAgeMs: MAX_STALE_AGE_MS,
      });
    },
    /Sitemap payload expired: age \d+ms exceeds maximum allowable/,
    'Route must refuse to return payload when generation age exceeds MAX_STALE_AGE_MS'
  );
});

test('Production sitemap: fallback data preserves original generatedAt and does NOT reset age to zero', async () => {
  const cache = new MemoryCacheAdapter();
  const startTime = 1_000_000;
  const mockJobs = [
    { id: 101, slug: 'railway-job', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' } },
  ];

  // Step 1: Initial successful generation at startTime
  const initialPayload = await generateSitemapWithResilience({
    fetchJobs: async () => mockJobs,
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    cache,
    now: startTime,
  });
  assert.equal(initialPayload.generatedAt, startTime);

  // Step 2: Jobs API fails 2 hours later
  const outageTime = startTime + 2 * 3600 * 1000;
  const fallbackPayload = await generateSitemapWithResilience({
    fetchJobs: async () => { throw new Error('Transient jobs API outage: 502 Bad Gateway'); },
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    cache,
    now: outageTime,
  });

  // Verify: generatedAt reflects original successful generation, NOT outageTime
  assert.equal(
    fallbackPayload.generatedAt,
    startTime,
    'Fallback data must preserve original generatedAt and not reset age to zero'
  );

  // Step 3: At route level, verify age is evaluated from original generation time
  const routeTimeExpired = startTime + MAX_STALE_AGE_MS + 1000; // 24h + 1s from initial generation
  await assert.rejects(
    async () => {
      await handleSitemapRoute({
        fetchPayload: async () => fallbackPayload,
        now: routeTimeExpired,
        maxStaleAgeMs: MAX_STALE_AGE_MS,
      });
    },
    /Sitemap payload expired: age \d+ms exceeds maximum allowable/,
    'Route must reject fallback data once true age from original generation exceeds MAX_STALE_AGE_MS'
  );
});

test('Production sitemap: new server instance with shared durable cache retains valid study URLs during study outage', async () => {
  // Simulate shared durable framework cache (e.g. Next.js Data Cache / Vercel KV shared across instances)
  const sharedDurableCache = new MemoryCacheAdapter();
  const t0 = Date.now();

  // Instance 1 (warm): Runs when study endpoints are healthy
  await resolveStudySitemapData({
    fetchLiveStudy: async () => ({
      subjects: [{ slug: 'bangla', question_count: 15 }],
      collections: [{ slug: 'bcs-set-1', question_count: 15 }],
      questionTotal: 15, // >= MIN_INDEXABLE_QUESTIONS (10)
      affairsTotal: 0,
      affairsLatestDate: null,
      updatedAt: t0,
    }),
    cache: sharedDurableCache,
    now: t0,
  });

  // Instance 2 (completely new server instance / cold start):
  // Has NO process memory from Instance 1, but connects to shared durable cache.
  // Study API is currently DOWN (throws 500).
  const instance2StudyData = await resolveStudySitemapData({
    fetchLiveStudy: async () => {
      throw new Error('Study API 500 Internal Server Error');
    },
    cache: sharedDurableCache, // reads from shared durable framework cache
    now: t0 + 60_000,
  });

  assert.equal(instance2StudyData.questionTotal, 15, 'Instance 2 must retain question count from durable cache');
  assert.equal(instance2StudyData.subjects[0].slug, 'bangla', 'Instance 2 must retain subject from durable cache');

  // Verify that Instance 2 generates sitemap including the study URLs
  const instance2Payload = await generateSitemapWithResilience({
    fetchJobs: async () => [
      { id: 1, slug: 'govt-officer-job', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' } },
    ],
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    fetchStudyData: async () => instance2StudyData,
    cache: new MemoryCacheAdapter(), // Instance 2 local cache
    now: t0 + 60_000,
  });

  const urls = instance2Payload.entries.map((e) => e.url);
  assert.ok(urls.includes('https://dailyjobs.bd/question-bank'), 'Study bank must be present in new instance sitemap');
  assert.ok(urls.includes('https://dailyjobs.bd/question-bank/subject/bangla'), 'Subject URL must be present in new instance');
  assert.ok(urls.includes('https://dailyjobs.bd/job/govt-officer-job'), 'Job URL must be present in new instance');
});

test('Production sitemap: cold instance with NO shared durable cache omits study URLs without blocking jobs', async () => {
  // Boundary / Limit case: Brand new deploy, clean cache, study API down on initial request
  const emptyDurableCache = new MemoryCacheAdapter();
  const now = Date.now();

  const studyData = await resolveStudySitemapData({
    fetchLiveStudy: async () => {
      throw new Error('Study API unreachable on cold start');
    },
    cache: emptyDurableCache,
    now,
  });

  // When no cache history exists, question count gracefully defaults to 0
  assert.equal(studyData.questionTotal, 0);

  const payload = await generateSitemapWithResilience({
    fetchJobs: async () => [
      { id: 1, slug: 'govt-officer-job', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' } },
    ],
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    fetchStudyData: async () => studyData,
    cache: emptyDurableCache,
    now,
  });

  const urls = payload.entries.map((e) => e.url);
  assert.ok(urls.includes('https://dailyjobs.bd/job/govt-officer-job'), 'Jobs must be generated');
  assert.equal(urls.includes('https://dailyjobs.bd/question-bank'), false, 'Sub-threshold study omitted without crash');
});

test('Production sitemap: resolveStudySitemapData omits study data when snapshot updatedAt exceeds MAX_STALE_AGE_MS while jobs remain active', async () => {
  const cache = new MemoryCacheAdapter();
  const now = 100_000_000;
  const expiredStudyTimestamp = now - (MAX_STALE_AGE_MS + 3600_000); // 25 hours old

  // Framework cache returns a previously cached study snapshot that is 25 hours old
  const expiredStudySnapshot = {
    subjects: [{ slug: 'bangla', question_count: 20 }],
    collections: [{ slug: 'bcs', question_count: 20 }],
    questionTotal: 20, // would qualify if fresh
    affairsTotal: 0,
    affairsLatestDate: null,
    updatedAt: expiredStudyTimestamp,
  };

  const resolvedStudyData = await resolveStudySitemapData({
    fetchLiveStudy: async () => expiredStudySnapshot,
    cache,
    now,
    maxStaleAgeMs: MAX_STALE_AGE_MS,
  });

  // 1. Study data age verified against actual updatedAt: outdated data must be omitted (count 0)
  assert.equal(resolvedStudyData.questionTotal, 0, 'Outdated study data must be rejected and omitted');
  assert.equal(resolvedStudyData.subjects.length, 0);

  // 2. Process cache must NOT store an expired snapshot with reset age
  const cached = await cache.get('dailyjobs-study-sitemap-v1');
  assert.equal(cached, null, 'Must not save expired snapshot into process cache as fresh');

  // 3. Jobs sitemap generation continues actively with jobs and static URLs
  const payload = await generateSitemapWithResilience({
    fetchJobs: async () => [
      { id: 10, slug: 'bcs-cadre-job', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' } },
    ],
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    fetchStudyData: async () => resolvedStudyData,
    cache,
    now,
  });

  const urls = payload.entries.map((e) => e.url);
  assert.ok(urls.includes('https://dailyjobs.bd/job/bcs-cadre-job'), 'Jobs sitemap must stay active');
  assert.ok(urls.includes('https://dailyjobs.bd/category/govt_jobs'), 'Categories must remain active');
  assert.ok(urls.includes('https://dailyjobs.bd/'), 'Home page must remain active');
  assert.equal(urls.includes('https://dailyjobs.bd/question-bank'), false, 'Expired study URL must be excluded');
});


test('Production sitemap: full success with published jobs generates job, category, and static URLs', async () => {
  const mockJobs = [
    { id: 1, slug: 'govt-officer-job', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' }, published_at: '2026-10-10' },
    { id: 2, slug: 'bank-officer-job', category: { slug: 'bank_jobs', name: 'ব্যাংক চাকরি' }, published_at: '2026-10-11' },
  ];
  const mockCategories = [
    { slug: 'govt_jobs', name: 'সরকারি চাকরি' },
    { slug: 'bank_jobs', name: 'ব্যাংক চাকরি' },
    { slug: 'ngo_jobs', name: 'এনজিও চাকরি' }, // Empty category (0 jobs)
  ];

  const cache = new MemoryCacheAdapter();
  const payload = await generateSitemapWithResilience({
    fetchJobs: async () => mockJobs,
    fetchCategories: async () => mockCategories,
    fetchStudyData: async () => ({
      subjects: [],
      collections: [],
      questionTotal: 1, // Below MIN_INDEXABLE_QUESTIONS (10)
      affairsTotal: 0,
      affairsLatestDate: null,
      updatedAt: Date.now(),
    }),
    cache,
  });

  const urls = payload.entries.map((e) => e.url);
  assert.ok(urls.includes('https://dailyjobs.bd/'), 'Home URL must be present');
  assert.ok(urls.includes('https://dailyjobs.bd/category/govt_jobs'), 'Govt category must be present');
  assert.ok(urls.includes('https://dailyjobs.bd/category/bank_jobs'), 'Bank category must be present');
  assert.equal(urls.includes('https://dailyjobs.bd/category/ngo_jobs'), false, 'Empty category must be excluded');
  assert.ok(urls.includes('https://dailyjobs.bd/job/govt-officer-job'), 'Govt job URL must be present');
  assert.ok(urls.includes('https://dailyjobs.bd/job/bank-officer-job'), 'Bank job URL must be present');
  assert.ok(urls.includes('https://dailyjobs.bd/about'), 'Static /about must be present');
  assert.ok(urls.includes('https://dailyjobs.bd/contact'), 'Static /contact must be present');
  assert.ok(urls.includes('https://dailyjobs.bd/sources'), 'Static /sources must be present');
  assert.equal(urls.includes('https://dailyjobs.bd/question-bank'), false, 'Sub-threshold study pages must be excluded');

  // Verify stored in cache
  const cached = await cache.get(SITEMAP_CACHE_KEY);
  assert.ok(cached !== null, 'Successful generation must populate cache');
});

test('Production sitemap: genuine zero published jobs generates valid sitemap with static pages without error', async () => {
  // Successful API response returning 0 published jobs (genuine empty result, not API failure)
  const cache = new MemoryCacheAdapter();
  const payload = await generateSitemapWithResilience({
    fetchJobs: async () => [],
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    cache,
  });

  assert.ok(Array.isArray(payload.entries), 'Must return valid sitemap entries array');
  const urls = payload.entries.map((e) => e.url);

  // Home and static pages must still be valid and indexable
  assert.ok(urls.includes('https://dailyjobs.bd/'));
  assert.ok(urls.includes('https://dailyjobs.bd/about'));
  assert.ok(urls.includes('https://dailyjobs.bd/contact'));
  assert.ok(urls.includes('https://dailyjobs.bd/privacy'));
  assert.ok(urls.includes('https://dailyjobs.bd/disclaimer'));

  // Zero published jobs means no category or job detail URLs
  assert.equal(urls.includes('https://dailyjobs.bd/category/govt_jobs'), false);
  assert.equal(payload.entries.filter((e) => e.url.includes('/job/')).length, 0);
});

test('Production sitemap: cold start jobs API failure throws honest retryable error', async () => {
  const cache = new MemoryCacheAdapter(); // Cold cache

  await assert.rejects(
    async () => {
      await generateSitemapWithResilience({
        fetchJobs: async () => { throw new Error('Public API unavailable for /jobs: 500'); },
        fetchCategories: async () => [],
        cache,
      });
    },
    (err) => {
      assert.ok(err instanceof Error);
      assert.ok(err.message.includes('Public API unavailable for /jobs'));
      return true;
    },
    'Cold start jobs API failure must throw an honest retryable error instead of returning empty sitemap'
  );
});

test('Production sitemap: recovery refreshes sitemap and updates generatedAt timestamp', async () => {
  const cache = new MemoryCacheAdapter();
  let time = 1000;

  // Step 1: Initial run with old job
  const res1 = await generateSitemapWithResilience({
    fetchJobs: async () => [
      { id: 201, slug: 'old-circular', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' } },
    ],
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    cache,
    now: time,
  });
  assert.ok(res1.entries.some((e) => e.url.includes('old-circular')));
  assert.equal(res1.generatedAt, 1000);

  // Step 2: Outage (serves fallback with preserved original generatedAt)
  time += 60000;
  const res2 = await generateSitemapWithResilience({
    fetchJobs: async () => { throw new Error('Database offline'); },
    fetchCategories: async () => [],
    cache,
    now: time,
  });
  assert.ok(res2.entries.some((e) => e.url.includes('old-circular')), 'Fallback serves old job');
  assert.equal(res2.generatedAt, 1000, 'Fallback preserves original generatedAt');

  // Step 3: API recovers with new job
  time += 60000;
  const res3 = await generateSitemapWithResilience({
    fetchJobs: async () => [
      { id: 202, slug: 'new-bcs-circular', category: { slug: 'govt_jobs', name: 'সরকারি চাকরি' } },
    ],
    fetchCategories: async () => [{ slug: 'govt_jobs', name: 'সরকারি চাকরি' }],
    cache,
    now: time,
  });
  assert.ok(res3.entries.some((e) => e.url.includes('new-bcs-circular')), 'Refreshed sitemap must include new job');
  assert.equal(res3.entries.some((e) => e.url.includes('old-circular')), false, 'Outdated job should be replaced upon recovery');
  assert.equal(res3.generatedAt, time, 'Recovered sitemap must update generatedAt to fresh timestamp');
});

test('Sitemap pagination guard: throws explicit error when last_page exceeds 1000 cap', async () => {
  async function simulateGetAllJobs(lastPage) {
    const all = [];
    let page = 1;
    const MAX_PAGES = 1000;
    do {
      all.push({ id: page });
      if (lastPage > MAX_PAGES) {
        throw new Error(`Public job list exceeds sitemap page cap: last_page is ${lastPage} (cap: ${MAX_PAGES})`);
      }
      page++;
    } while (page <= lastPage);
    return all;
  }

  const normal = await simulateGetAllJobs(5);
  assert.equal(normal.length, 5);

  await assert.rejects(
    async () => {
      await simulateGetAllJobs(1005);
    },
    /Public job list exceeds sitemap page cap: last_page is 1005/
  );
});


