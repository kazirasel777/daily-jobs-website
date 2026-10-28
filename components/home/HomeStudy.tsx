// File: components/home/HomeStudy.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import HomeIcon from './HomeIcons';

type StudyTabKey = 'bcs' | 'bank' | 'teacher' | 'recent';

interface StudyItem {
  title: string;
  subtitle: string;
  href: string;
}

const STUDY_SETS: Record<StudyTabKey, StudyItem[]> = {
  bcs: [
    { title: '৪৪তম বিসিএস প্রিলিমিনারি', subtitle: 'প্রশ্ন ও ব্যাখ্যা দেখুন', href: '/question-bank' },
    { title: '৪৬তম বিসিএস প্রিলিমিনারি', subtitle: 'বিগত পরীক্ষার প্রশ্ন', href: '/question-bank' },
    { title: 'বাংলা ভাষা ও সাহিত্য', subtitle: 'বিষয়ভিত্তিক অনুশীলন', href: '/question-bank' },
  ],
  bank: [
    { title: 'সমন্বিত ব্যাংক — অফিসার', subtitle: 'বিগত পরীক্ষার প্রশ্ন', href: '/question-bank' },
    { title: 'বাংলাদেশ ব্যাংক — সহকারী পরিচালক', subtitle: 'প্রশ্ন ও ব্যাখ্যা', href: '/question-bank' },
    { title: 'ব্যাংক প্রস্তুতি — গণিত', subtitle: 'বিষয়ভিত্তিক অনুশীলন', href: '/question-bank' },
  ],
  teacher: [
    { title: 'প্রাথমিক সহকারী শিক্ষক', subtitle: 'বিগত পরীক্ষার প্রশ্ন', href: '/question-bank' },
    { title: 'শিক্ষক নিবন্ধন — স্কুল', subtitle: 'প্রশ্ন ও ব্যাখ্যা', href: '/question-bank' },
    { title: 'শিক্ষক নিবন্ধন — কলেজ', subtitle: 'বিগত পরীক্ষার প্রশ্ন', href: '/question-bank' },
  ],
  recent: [
    { title: 'সাম্প্রতিক ব্যাংক নিয়োগ পরীক্ষা', subtitle: 'নতুন প্রশ্নসেট', href: '/question-bank' },
    { title: 'সরকারি নিয়োগের সাম্প্রতিক প্রশ্ন', subtitle: 'প্রশ্ন ও ব্যাখ্যা', href: '/question-bank' },
    { title: 'সাম্প্রতিক সাধারণ জ্ঞান', subtitle: 'বিষয়ভিত্তিক পড়ুন', href: '/current-affairs' },
  ],
};

export default function HomeStudy() {
  const [activeTab, setActiveTab] = useState<StudyTabKey>('bcs');

  return (
    <section className="home-section" id="question-bank" aria-labelledby="study-heading">
      <div className="home-section-bar">
        <div className="home-section-heading">
          <h2 id="study-heading">প্রশ্নব্যাংক ও প্রস্তুতি</h2>
        </div>
        <span className="home-small-link">প্রশ্ন · উত্তর · ব্যাখ্যা</span>
      </div>

      <div className="home-panel home-study-block">
        <div className="home-study-left">
          <p className="home-eyebrow">বিগত পরীক্ষায় নিজেকে যাচাই করুন</p>
          <h3>
            প্রস্তুতি হোক
            <br />
            আরও গোছানো।
          </h3>
          <p>বিভাগ বেছে প্রশ্নসেট দেখুন।</p>
          <div className="home-study-tabs" aria-label="প্রশ্নব্যাংকের বিভাগ">
            <button
              type="button"
              className={activeTab === 'bcs' ? 'active' : ''}
              aria-pressed={activeTab === 'bcs'}
              onClick={() => setActiveTab('bcs')}
            >
              বিসিএস
            </button>
            <button
              type="button"
              className={activeTab === 'bank' ? 'active' : ''}
              aria-pressed={activeTab === 'bank'}
              onClick={() => setActiveTab('bank')}
            >
              ব্যাংক
            </button>
            <button
              type="button"
              className={activeTab === 'teacher' ? 'active' : ''}
              aria-pressed={activeTab === 'teacher'}
              onClick={() => setActiveTab('teacher')}
            >
              শিক্ষক নিয়োগ
            </button>
            <button
              type="button"
              className={activeTab === 'recent' ? 'active' : ''}
              aria-pressed={activeTab === 'recent'}
              onClick={() => setActiveTab('recent')}
            >
              সাম্প্রতিক পরীক্ষা
            </button>
          </div>
        </div>

        <div className="home-study-sets" aria-live="polite">
          {STUDY_SETS[activeTab].map((item, idx) => (
            <Link key={idx} href={item.href} className="home-study-item">
              <span>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </span>
              <HomeIcon name="arrow" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
