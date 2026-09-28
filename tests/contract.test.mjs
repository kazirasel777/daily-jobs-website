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


