// File: components/Pagination.tsx
// Server-rendered pagination with real <a href> links so crawlers can follow every page.
import Link from 'next/link';
import Icon from '@/components/Icon';
import { toBnDigits } from '@/lib/format';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  /** Builds the URL for a page number (page 1 should have no ?page parameter). */
  hrefFor: (page: number) => string;
}

function pageList(current: number, last: number): (number | 'gap')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set([1, last, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= last - 2) [last - 3, last - 2, last - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

const base = 'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold';

export default function Pagination({ currentPage, lastPage, hrefFor }: PaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <nav aria-label="পৃষ্ঠা নির্বাচন" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {currentPage > 1 && (
        <Link href={hrefFor(currentPage - 1)} rel="prev" className={`${base} gap-1 border border-line bg-surface text-ink-soft hover:border-brand-600 hover:text-brand-700`}>
          <Icon name="chevronLeft" /> আগের
        </Link>
      )}
      {pageList(currentPage, lastPage).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden="true">…</span>
        ) : p === currentPage ? (
          <span key={p} aria-current="page" className={`${base} bg-brand-800 text-white`}>{toBnDigits(p)}</span>
        ) : (
          <Link key={p} href={hrefFor(p)} aria-label={`পৃষ্ঠা ${toBnDigits(p)}`} className={`${base} border border-line bg-surface text-ink-soft hover:border-brand-600 hover:text-brand-700`}>
            {toBnDigits(p)}
          </Link>
        ),
      )}
      {currentPage < lastPage && (
        <Link href={hrefFor(currentPage + 1)} rel="next" className={`${base} gap-1 border border-line bg-surface text-ink-soft hover:border-brand-600 hover:text-brand-700`}>
          পরের <Icon name="chevronRight" />
        </Link>
      )}
    </nav>
  );
}
