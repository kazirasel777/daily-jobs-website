// File: components/Pagination.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
}

const toBengaliNumber = (num: number | string) => {
  if (num === '...') return '...';
  const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (x) => digits[Number(x)]);
};

export default function Pagination({ currentPage, lastPage }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (lastPage <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getPages = () => {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', lastPage];
    }

    if (currentPage >= lastPage - 3) {
      return [1, '...', lastPage - 4, lastPage - 3, lastPage - 2, lastPage - 1, lastPage];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', lastPage];
  };

  const pages = getPages();

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-1.5 sm:gap-2 mt-10 mb-6">
      
      {/* ⬅️ Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={createPageURL(currentPage - 1)}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-all shadow-xs"
          aria-label="পূর্ববর্তী পৃষ্ঠা"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : (
        <span
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed"
          aria-hidden="true"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </span>
      )}

      {/* 🔢 Page Numbers */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-7 h-9 text-slate-400 font-bold tracking-widest text-xs"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <Link
              key={page}
              href={createPageURL(page)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-center w-8 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
              }`}
            >
              {toBengaliNumber(page)}
            </Link>
          );
        })}
      </div>

      {/* ➡️ Next Button */}
      {currentPage < lastPage ? (
        <Link
          href={createPageURL(currentPage + 1)}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-all shadow-xs"
          aria-label="পরবর্তী পৃষ্ঠা"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed"
          aria-hidden="true"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}

    </nav>
  );
}