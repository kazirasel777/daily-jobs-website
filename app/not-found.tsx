// File: app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
          ৪০৪
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          কাঙ্ক্ষিত পাতাটি পাওয়া যায়নি
        </h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          বিজ্ঞপ্তিটি মেয়াদোত্তীর্ণ হয়ে থাকতে পারে অথবা প্রদত্ত ঠিকানাটি সঠিক নয়।
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          হোমপেজে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
