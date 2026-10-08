// File: app/job/[slug]/not-found.tsx
import Link from 'next/link';
import SearchForm from '@/components/SearchForm';

export default function JobNotFound() {
  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">বিজ্ঞপ্তিটি এখন আর দেখানো হচ্ছে না</h1>
      <p className="mt-3 text-ink-soft">
        আবেদনের সময় শেষ হয়ে যাওয়ায় বা প্রকাশ প্রত্যাহার করায় বিজ্ঞপ্তিটি তালিকা থেকে সরানো হয়েছে, অথবা ঠিকানাটি সঠিক নয়।
      </p>
      <div className="mt-6 text-left">
        <SearchForm />
      </div>
      <Link href="/" className="mt-6 inline-block font-bold text-brand-700 hover:underline">সর্বশেষ সক্রিয় বিজ্ঞপ্তি দেখুন →</Link>
    </div>
  );
}
