// File: app/category/[slug]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import JobCard from '@/components/JobCard';
import Pagination from '@/components/Pagination';
import { getJobCategories, getJobs } from '@/lib/api';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getJobCategories();
  const category = categories.find((c) => c.slug === slug);
  const categoryName = category ? category.name : slug.replace(/[-_]/g, ' ');

  return {
    title: `${categoryName} সার্কুলার ও নিয়োগ বিজ্ঞপ্তি`,
    description: `বাংলাদেশের সর্বশেষ ${categoryName} সংক্রান্ত সকল চাকরির নিয়োগ বিজ্ঞপ্তি, আবেদনের শেষ তারিখ ও বিস্তারিত তথ্য।`,
    alternates: {
      canonical: `https://dailyjobs.bd/category/${slug}`,
    },
    openGraph: {
      title: `${categoryName} সার্কুলার ও নিয়োগ বিজ্ঞপ্তি | দৈনিক চাকরি`,
      description: `বাংলাদেশের সর্বশেষ ${categoryName} সংক্রান্ত সকল চাকরির খবর।`,
      url: `https://dailyjobs.bd/category/${slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryJobs({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const rawPage = resolvedSearchParams.page;
  const currentPage = typeof rawPage === 'string' ? Math.max(1, parseInt(rawPage, 10) || 1) : 1;

  const [categories, jobsResponse] = await Promise.all([
    getJobCategories(),
    getJobs({
      category: slug,
      page: currentPage,
      per_page: 20,
    }),
  ]);

  const category = categories.find((c) => c.slug === slug);
  const categoryName = category ? category.name : slug.replace(/[-_]/g, ' ');

  const jobs = jobsResponse.data;
  const meta = jobsResponse.meta;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ক্যাটাগরি হেডার কার্ড */}
        <div className="mb-6 sm:mb-8 bg-white p-5 sm:p-7 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm font-semibold mb-2 inline-flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              হোমপেজে ফিরে যান
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1">
              {categoryName}
            </h1>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">
              এই ক্যাটাগরির সর্বশেষ সকল সরকারি ও বেসরকারি নিয়োগ বিজ্ঞপ্তি
            </p>
          </div>
          
          <div className="bg-orange-50 px-4 py-2.5 rounded-xl border border-orange-100 text-center shrink-0">
            <span className="block text-xl sm:text-2xl font-black text-orange-600">
              {meta.total}
            </span>
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">
              মোট বিজ্ঞপ্তি
            </span>
          </div>
        </div>

        {/* জব তালিকা */}
        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}

            <Pagination currentPage={meta.current_page} lastPage={meta.last_page} />
          </div>
        ) : (
          <div className="bg-white p-12 sm:p-16 rounded-2xl text-center border border-slate-100 shadow-xs flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">
              বর্তমানে এই ক্যাটাগরিতে কোনো সক্রিয় বিজ্ঞপ্তি নেই
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
              নতুন বিজ্ঞপ্তি প্রকাশিত হওয়া মাত্রই এখানে স্বয়ংক্রিয়ভাবে যোগ হয়ে যাবে।
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
            >
              অন্যান্য ক্যাটাগরির চাকরি দেখুন
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}