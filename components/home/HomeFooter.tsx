// File: components/home/HomeFooter.tsx
import Link from 'next/link';
import { SITE } from '@/lib/site';

export default function HomeFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="home-footer">
      <div className="home-wrap">
        <div className="home-footer-row">
          <div>
            <Link className="home-footer-title" href="/">
              দৈনিক চাকরি
            </Link>
            <p>
              বিভিন্ন প্রতিষ্ঠান ও প্রকাশিত সূত্র থেকে সংগ্রহ করা চাকরির খবর। দৈনিক চাকরি কোনো সরকারি প্রতিষ্ঠান বা নিয়োগকারী সংস্থা নয় এবং এই সাইটে কোনো আবেদন গ্রহণ করা হয় না।
            </p>
            <p style={{ marginTop: '6px' }}>
              যোগাযোগ:{' '}
              <a
                href={`mailto:${SITE.email}`}
                style={{ color: 'var(--home-green)', fontWeight: 600, textDecoration: 'underline' }}
              >
                {SITE.email}
              </a>
            </p>
          </div>
          <nav className="home-footer-links" aria-label="অন্যান্য তথ্য">
            <Link href="/about">আমাদের সম্পর্কে</Link>
            <Link href="/sources">তথ্যের উৎস</Link>
            <Link href="/contact">যোগাযোগ</Link>
            <Link href="/privacy">গোপনীয়তা</Link>
            <Link href="/disclaimer">দায়মুক্তি</Link>
            <Link href="/question-bank">প্রশ্নব্যাংক</Link>
            <Link href="/current-affairs">সাধারণ জ্ঞান</Link>
          </nav>
        </div>
        <div className="home-footer-bottom">
          <span>
            © {year} {SITE.name} ({SITE.nameEn})
          </span>
          <span>আবেদনের আগে মূল বিজ্ঞপ্তি ও নিয়োগকারীর অফিশিয়াল ওয়েবসাইট যাচাই করুন।</span>
        </div>
      </div>
    </footer>
  );
}
