// File: components/Footer.tsx
import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '@/lib/site';
import type { JobCategory } from '@/types/job';

export default function Footer({ categories = [] }: { categories?: JobCategory[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="premium-footer" id="site-footer">
      <div className="wrap">
        <div className="footer-promise">
          <span className="footer-kicker">আপনার পরের সুযোগের ঠিকানা</span>
          <p>
            সঠিক তথ্য থেকে <strong>সঠিক সিদ্ধান্ত।</strong>
          </p>
          <div className="footer-process">
            <span>০১ <b>চাকরি খুঁজুন</b></span>
            <span>০২ <b>মূল সূত্র মিলিয়ে নিন</b></span>
            <span>০৩ <b>সরাসরি আবেদন করুন</b></span>
          </div>
        </div>

        <div className="footer-columns">
          <div className="footer-about">
            <Link className="footer-brand" href="/" aria-label="দৈনিক চাকরি — প্রথম পাতা">
              <Image
                src="/brand/dainik-chakri-logo.png"
                alt="দৈনিক চাকরি"
                width={98}
                height={60}
                style={{ width: '92px', height: 'auto', display: 'block' }}
              />
            </Link>
            <p>
              চাকরির বিজ্ঞপ্তি ও প্রস্তুতি—একটি ঠিকানায়। মূল সূত্রের তথ্য নির্ভরযোগ্যভাবে পৌঁছে দেওয়াই আমাদের লক্ষ্য।
            </p>
            <a className="footer-mail" href={`mailto:${SITE.email}`}>
              {SITE.email} ↗
            </a>
          </div>

          <nav aria-label="চাকরির বিভাগ">
            <h3>সুযোগ খুঁজুন</h3>
            <Link href="/">সকল চাকরি</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </nav>

          <nav aria-label="প্রস্তুতি ও আপডেট">
            <h3>আরও এগিয়ে থাকুন</h3>
            <Link href="/#notices">নোটিশ ও ফলাফল</Link>
            <Link href="/question-bank">প্রশ্নব্যাংক ও প্রস্তুতি</Link>
            <Link href="/current-affairs">সাধারণ জ্ঞান</Link>
            <Link href="/sources">তথ্যের উৎস ↗</Link>
            <Link href="/about">আমাদের সম্পর্কে</Link>
          </nav>

          <nav aria-label="সাইটের তথ্য">
            <h3>জেনে রাখুন</h3>
            <Link href="/contact">যোগাযোগ</Link>
            <Link href="/privacy">গোপনীয়তা নীতি</Link>
            <Link href="/disclaimer">দায়মুক্তি</Link>
          </nav>
        </div>

        <div className="footer-trust">
          <span className="trust-mark">i</span>
          <p>
            দৈনিক চাকরি কোনো সরকারি প্রতিষ্ঠান বা নিয়োগকারী সংস্থা নয়। এখানে আবেদন গ্রহণ করা হয় না। আবেদনের আগে মূল বিজ্ঞপ্তি ও অফিশিয়াল ওয়েবসাইট যাচাই করুন।
          </p>
          <Link href="/sources">
            আমাদের তথ্যের উৎস <span>↗</span>
          </Link>
        </div>

        <div className="premium-bottom">
          <span>© {year} {SITE.name} · {SITE.nameEn.toUpperCase()}</span>
          <span>আবেদনের আগে মূল বিজ্ঞপ্তি ও নিয়োগকারীর অফিশিয়াল ওয়েবসাইট যাচাই করুন।</span>
          <a href="#main">উপরে ফিরুন ↑</a>
        </div>
      </div>
    </footer>
  );
}
