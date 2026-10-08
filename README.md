# DailyJobs Public Website (দৈনিক চাকরি)

This is the public web portal for **DailyJobs**, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4. It connects to the Laravel Admin Panel's Client API (`/api/v1`) as its source of truth.

## Features & Architecture

- **Home (`/`)**: latest active jobs (server-rendered, paginated with `?page=N`), category tiles with live counts, closing-soon list. Old `/?q=`, `/?search=` and `/?category=` links redirect permanently to `/search` and `/category/[slug]`.
- **Category (`/category/[slug]`)**: only categories the API publishes; unknown slugs and out-of-range pages return 404. Empty categories are `noindex`.
- **Job detail (`/job/[slug]`)**: ISR (5 min). Key facts, sanitised description, circular scans, apply box that links to the employer only. Numeric `/job/{id}` links redirect to the slug URL. Expired/unpublished jobs are a real 404 (the API does not return them).
- **Search (`/search?q=`)**: internal search, always `noindex, follow`.
- **Question bank (`/question-bank`, `/question-bank/subject/[slug]`, `/question-bank/set/[slug]`)**: read-only questions with answers and explanations. Pages with fewer than 10 questions are `noindex` and left out of the sitemap until content grows.
- **Current affairs (`/current-affairs`)**: same rule (indexed from 10 items).
- **About / Contact / Privacy / Disclaimer**.
- **API outages** throw `ApiUnavailableError` → `app/error.tsx` with HTTP 500, never an empty list or a 404.
- **Structured data**: Organization/WebSite on home, BreadcrumbList on inner pages, JobPosting only for a single named post with exact open deadline, real employer, specific location and a full description (`lib/seo.ts`).
- **Sitemap & robots**: dynamic sitemap built from every API page (no truncation); robots disallows only `/api/`. Preview deployments (`VERCEL_ENV=preview`) are fully `noindex` and disallowed.
- **Deduplicated view counting**: `/api/jobs/[id]/view` proxies to the API with a session UUID.

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

| Variable | Description | Example |
|---|---|---|
| `API_BASE_URL` | Optional server-only override for the verified Laravel Public API v1 base URL | `https://jobs.kazitechsolutions.com/api/v1` |
| `SITE_URL` | Canonical apex website URL | `https://dailyjobs.bd` |
| `GA_MEASUREMENT_ID` | (Optional) Google Analytics 4 ID | `G-XXXXXXXXXX` |

The verified public API host is the default when `API_BASE_URL` is unset. Keep the environment variable server-only; no admin or agent token is used by this site.

## Scripts

```bash
# Run development server
npm run dev

# Run contract tests
npm test

# Run ESLint checks
npm run lint

# Run TypeScript checks
npx tsc --noEmit

# Production build
npm run build

# Start production server
npm run start
```

## Deployment on Vercel

1. Connect the dedicated repository `kazirasel777/daily-jobs-website` to Vercel.
2. In the Vercel Project Settings under **Environment Variables**, configure:
   - `API_BASE_URL`: `https://jobs.kazitechsolutions.com/api/v1`.
   - `SITE_URL`: `https://dailyjobs.bd`.
   - `GA_MEASUREMENT_ID`: (Optional) Your Google Analytics measurement ID.
3. In Vercel Domain Settings, add `dailyjobs.bd` as the primary production domain and configure `www.dailyjobs.bd` to redirect to `dailyjobs.bd`.
