// File: app/error.tsx
'use client';

import Link from 'next/link';
import { useEffect } from 'react';

// Shown when the jobs API is unreachable. Nothing here claims that content is missing.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">তথ্য আনতে সাময়িক সমস্যা হচ্ছে</h1>
      <p className="mt-3 text-ink-soft">আমাদের তথ্যভান্ডারের সঙ্গে সংযোগ এই মুহূর্তে পাওয়া যাচ্ছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-brand-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          আবার চেষ্টা করুন
        </button>
        <Link href="/" className="rounded-full border border-line-strong px-5 py-2.5 text-sm font-bold text-ink-soft hover:border-brand-600">
          প্রথম পাতা
        </Link>
      </div>
    </div>
  );
}
