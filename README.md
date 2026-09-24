# DailyJobs Public Website (দৈনিক চাকরি)

This is the public web portal for **DailyJobs**, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4. It connects to the Laravel Admin Panel's Client API (`/api/v1`) as its source of truth.

## Features & Architecture

- **Home Page (`/`)**: Latest active jobs with live pagination, category filter tabs, and text search (`q`).
- **Category Archive (`/category/[slug]`)**: Dedicated category pages (`govt_jobs`, `bank_jobs`, `private_jobs`, `defense_jobs`, `ngo_education`, `other_jobs`).
- **Job Details (`/job/[slug]`)**: Crawlable SSR with organization details, vacancies, deadline countdown, sanitized HTML description, full-page circular evidence scans, and direct online application links.
- **Job detail metadata**: Each job has a canonical URL and page specific Open Graph metadata. Structured job markup is deferred until the API provides verified position level fields.
- **Question Bank (`/question-bank`)**: Read-only study and revision zone with MCQ options, correct answers, explanations, and exam origin badges.
- **Current Affairs (`/current-affairs`)**: Read-only timeline of recent general knowledge facts.
- **Deduplicated View Counting**: Server-proxied same-origin route handler (`/api/jobs/[id]/view`) with browser session UUID.
- **Sitemap & Robots (`/sitemap.xml`, `/robots.txt`)**: Dynamic sitemap with paginated 50-item batches and canonical apex domain (`https://dailyjobs.bd`).

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
