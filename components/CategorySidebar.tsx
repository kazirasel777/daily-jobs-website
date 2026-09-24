// File: components/CategorySidebar.tsx
import Link from 'next/link';
import type { JobCategory } from '@/types/job';

interface CategorySidebarProps {
  categories: JobCategory[];
  currentCategory?: string;
}

export default function CategorySidebar({ categories, currentCategory }: CategorySidebarProps) {
  const isAllActive = !currentCategory || currentCategory === 'all';

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs sticky top-24 border border-slate-100">
        
        <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-4 flex items-center gap-2.5">
          <span className="bg-orange-50 text-orange-600 p-1.5 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </span>
          চাকরির ক্যাটাগরি
        </h3>

        <div className="flex flex-col gap-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 custom-scrollbar">
          
          {/* সকল চাকরি লিংক */}
          <Link
            href="/"
            className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 overflow-hidden ${
              isAllActive
                ? 'bg-orange-50 text-orange-700 font-bold border border-orange-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
            }`}
          >
            {isAllActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-md"></div>
            )}
            <span className="flex items-center gap-2.5 relative z-10">সকল চাকরি</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md transition-colors relative z-10 ${
              isAllActive ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500 group-hover:bg-white'
            }`}>
              All
            </span>
          </Link>

          {/* ডাইনামিক ক্যাটাগরিগুলো */}
          {categories.map((cat) => {
            const isActive = currentCategory === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-orange-50 text-orange-700 font-bold border border-orange-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-md"></div>
                )}
                <span className="flex items-center gap-2.5 relative z-10">{cat.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 relative z-10 ${
                    isActive ? 'text-orange-600 translate-x-0.5' : 'text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}

          {categories.length === 0 && (
            <p className="text-xs text-slate-400 py-3 text-center">ক্যাটাগরি লোড হচ্ছে...</p>
          )}

        </div>
      </div>
    </aside>
  );
}