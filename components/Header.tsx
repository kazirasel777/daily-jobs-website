import Link from 'next/link';
import { Logo } from '@/components/Logo';
import NavStrip, { type NavItem } from '@/components/NavStrip';
import type { JobCategory } from '@/types/job';

export default function Header({ categories }: { categories: JobCategory[] }) {
  const items: NavItem[] = [
    { href: '/', label: 'প্রথম পাতা' },
    { href: '/#latest-heading', label: 'সকল চাকরি' },
    { href: '/question-bank', label: 'প্রশ্নব্যাংক' },
    { href: '/current-affairs', label: 'সাধারণ জ্ঞান' },
    { href: '/search', label: 'খুঁজুন' },
  ];
  return (
    <header className="relative z-40 border-b border-line bg-surface text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-white focus:p-3">মূল বিষয়ে যান</a>
      <div className="container-page flex min-h-18 items-center justify-between gap-5 sm:min-h-20">
        <Link href="/" aria-label="দৈনিক চাকরি — প্রথম পাতা" className="shrink-0 rounded-lg"><Logo /></Link>
        <div className="hidden md:block"><NavStrip items={items} /></div>
        <details className="relative md:hidden">
          <summary className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-semibold">মেনু</summary>
          <nav aria-label="মোবাইল মেনু" className="absolute right-0 top-full mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-line bg-surface p-3 shadow-lg">
            {[...items, ...categories.map(c => ({ href: `/category/${c.slug}`, label: c.name }))].map(item => <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-brand-50">{item.label}</Link>)}
          </nav>
        </details>
      </div>
    </header>
  );
}
