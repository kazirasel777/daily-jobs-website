// File: app/notices/[slug]/not-found.tsx
import Link from 'next/link';

export default function NoticeNotFound() {
  return (
    <div className="container-page max-w-2xl py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">নোটিশটি এখন আর দেখানো হচ্ছে না</h1>
      <p className="mt-3 text-ink-soft">প্রকাশ প্রত্যাহার করায় নোটিশটি সরানো হয়েছে, অথবা ঠিকানাটি সঠিক নয়।</p>
      <Link href="/notices" className="mt-6 inline-block font-bold text-brand-700 hover:underline">
        সর্বশেষ নোটিশ, পরীক্ষার সময়সূচি ও ফলাফল দেখুন →
      </Link>
    </div>
  );
}
