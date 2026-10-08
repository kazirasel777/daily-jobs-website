// File: app/not-found.tsx
import Link from 'next/link';
import SearchForm from '@/components/SearchForm';

export default function NotFound() {
  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <p className="font-serif text-5xl font-bold text-brand-800">৪০৪</p>
      <h1 className="mt-3 font-serif text-2xl font-bold text-ink">পাতাটি পাওয়া যায়নি</h1>
      <p className="mt-2 text-ink-soft">ঠিকানাটি ভুল হতে পারে, অথবা পাতাটি সরিয়ে নেওয়া হয়েছে।</p>
      <div className="mt-6 text-left">
        <SearchForm />
      </div>
      <Link href="/" className="mt-6 inline-block font-bold text-brand-700 hover:underline">প্রথম পাতায় যান →</Link>
    </div>
  );
}
