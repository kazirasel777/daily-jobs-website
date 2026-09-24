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
