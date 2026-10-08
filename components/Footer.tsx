// File: components/Footer.tsx
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SITE } from '@/lib/site';
import type { JobCategory } from '@/types/job';

export default function Footer({ categories }: { categories: JobCategory[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-brand-950 text-brand-100">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link href="/" aria-label="দৈনিক চাকরি — প্রথম পাতা" className="inline-block rounded-lg">
            <Logo inverted />
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-brand-100/85">
            জাতীয় দৈনিক ও প্রতিষ্ঠানের অফিশিয়াল উৎস থেকে চাকরির বিজ্ঞপ্তি সংগ্রহ করে আমরা পাঠযোগ্যভাবে প্রকাশ করি।
            দৈনিক চাকরি কোনো সরকারি প্রতিষ্ঠান বা নিয়োগকারী সংস্থা নয় এবং এই সাইটে কোনো আবেদন গ্রহণ করা হয় না।
          </p>
          <p className="mt-3 text-sm text-brand-100/85">
            যোগাযোগ:{' '}
            <a href={`mailto:${SITE.email}`} className="font-semibold text-white underline underline-offset-4">
              {SITE.email}
            </a>
          </p>
        </div>

        <nav aria-label="চাকরির বিভাগ" className="md:col-span-3">
          <h2 className="font-serif text-base font-bold text-white">চাকরির বিভাগ</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/" className="hover:text-white hover:underline">সর্বশেষ সব বিজ্ঞপ্তি</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-white hover:underline">{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="প্রস্তুতি ও তথ্য" className="md:col-span-4">
          <h2 className="font-serif text-base font-bold text-white">প্রস্তুতি ও তথ্য</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <li><Link href="/question-bank" className="hover:text-white hover:underline">প্রশ্নব্যাংক</Link></li>
            <li><Link href="/current-affairs" className="hover:text-white hover:underline">সাধারণ জ্ঞান</Link></li>
            <li><Link href="/about" className="hover:text-white hover:underline">আমাদের সম্পর্কে</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline">যোগাযোগ</Link></li>
            <li><Link href="/privacy" className="hover:text-white hover:underline">গোপনীয়তা নীতি</Link></li>
            <li><Link href="/disclaimer" className="hover:text-white hover:underline">দায়মুক্তি</Link></li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-brand-100/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {SITE.name} ({SITE.nameEn})</p>
          <p>আবেদনের আগে মূল বিজ্ঞপ্তি ও নিয়োগকারীর অফিশিয়াল ওয়েবসাইট যাচাই করুন।</p>
        </div>
      </div>
    </footer>
  );
}
