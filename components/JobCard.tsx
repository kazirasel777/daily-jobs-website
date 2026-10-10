// File: components/JobCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/Icon';
import DeadlineBadge from '@/components/DeadlineBadge';
import { formatDateBn, toBnNumber } from '@/lib/format';
import { jobPath } from '@/lib/site';
import type { JobListItem } from '@/types/job';

export default function JobCard({ job, headingLevel = 'h2' }: { job: JobListItem; headingLevel?: 'h2' | 'h3' }) {
  const href = jobPath(job);
  const Heading = headingLevel;

  return (
    <article className="card group relative flex flex-col gap-4 p-4 sm:min-h-40 sm:flex-row sm:items-center transition-shadow hover:shadow-[0_6px_24px_-12px_rgba(13,79,54,0.35)] sm:gap-5 sm:p-6">
      {job.thumbnail_url && (
        <div className="relative aspect-video w-32 sm:w-44 lg:w-48 shrink-0 overflow-hidden rounded-lg border border-line bg-paper sm:block">
          <Image
            src={job.thumbnail_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 192px, (min-width: 640px) 176px, 128px"
            className="object-contain"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          {job.category && (
            <Link
              href={`/category/${job.category.slug}`}
              className="relative z-10 rounded-md bg-brand-50 px-2 py-0.5 font-bold text-brand-700 hover:bg-brand-100"
            >
              {job.category.name}
            </Link>
          )}
          {job.recently_added && (
            <span className="rounded-md bg-marigold-100 px-2 py-0.5 font-bold text-marigold-900">নতুন</span>
          )}
          {job.circular_published_date && (
            <span className="text-muted">প্রকাশ: {formatDateBn(job.circular_published_date)}</span>
          )}
        </div>

        <Heading className="text-[1.125rem] font-bold leading-snug text-ink sm:text-xl">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl group-hover:text-brand-700">
            {job.title}
          </Link>
        </Heading>

        {job.organization_name && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <Icon name="building" className="h-4 w-4 shrink-0 text-muted" />
            <span className="truncate">{job.organization_name}</span>
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <DeadlineBadge deadline={job.deadline} />
          {job.deadline && (
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" className="h-4 w-4" />
              শেষ তারিখ: <strong className="font-semibold text-ink-soft">{formatDateBn(job.deadline)}</strong>
            </span>
          )}
          {job.vacancies !== null && job.vacancies > 0 && (
            <span className="inline-flex items-center gap-1">
              <Icon name="users" className="h-4 w-4" />
              {toBnNumber(job.vacancies)} জন
            </span>
          )}
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" className="h-4 w-4" />
              {job.location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
