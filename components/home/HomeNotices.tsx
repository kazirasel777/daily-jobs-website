// File: components/home/HomeNotices.tsx
'use client';

import { useState } from 'react';
import HomeIcon from './HomeIcons';

type NoticeType = 'all' | 'exam' | 'result' | 'admit';

interface NoticeItem {
  id: number;
  type: 'exam' | 'result' | 'admit';
  tag: string;
  title: string;
  org: string;
  date: string;
}

const SAMPLE_NOTICES: NoticeItem[] = [
  {
    id: 1,
    type: 'exam',
    tag: 'পরীক্ষা',
    title: 'লিখিত ও প্রিলিমিনারি পরীক্ষার সময়সূচি (নমুনা আপডেট)',
    org: 'নমুনা প্রতিষ্ঠান',
    date: 'শিগগিরই লাইভ নোটিশ যুক্ত হবে',
  },
  {
    id: 2,
    type: 'result',
    tag: 'ফলাফল',
    title: 'নিয়োগ পরীক্ষার লিখিত ফলাফল সংক্রান্ত নোটিশ (নমুনা আপডেট)',
    org: 'নমুনা কর্তৃপক্ষ',
    date: 'শিগগিরই লাইভ নোটিশ যুক্ত হবে',
  },
  {
    id: 3,
    type: 'admit',
    tag: 'প্রবেশপত্র',
    title: 'নিয়োগ পরীক্ষার প্রবেশপত্র সংগ্রহ ও আসনবিন্যাস (নমুনা আপডেট)',
    org: 'নমুনা সেল',
    date: 'শিগগিরই লাইভ নোটিশ যুক্ত হবে',
  },
  {
    id: 4,
    type: 'exam',
    tag: 'পরীক্ষা',
    title: 'মৌখিক ও ব্যবহারিক পরীক্ষার তারিখ সংক্রান্ত তথ্য (নমুনা আপডেট)',
    org: 'নমুনা পরিষদ',
    date: 'শিগগিরই লাইভ নোটিশ যুক্ত হবে',
  },
];

export default function HomeNotices() {
  const [activeTab, setActiveTab] = useState<NoticeType>('all');
  const [activeModal, setActiveModal] = useState<NoticeItem | null>(null);

  const filtered =
    activeTab === 'all'
      ? SAMPLE_NOTICES
      : SAMPLE_NOTICES.filter((n) => n.type === activeTab);

  return (
    <section className="home-section" id="notices" aria-labelledby="notices-heading">
      <div className="home-section-bar">
        <div className="home-section-heading">
          <h2 id="notices-heading">পরীক্ষার নোটিশ ও ফলাফল</h2>
        </div>
        <span className="home-small-link">
          <HomeIcon name="bell" />
          নিয়োগের পরের খবরও
        </span>
      </div>

      <div className="home-panel home-notice-panel">
        <div className="home-tabs" role="tablist" aria-label="নোটিশের ধরন">
          <button
            type="button"
            className={activeTab === 'all' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          >
            সব আপডেট
          </button>
          <button
            type="button"
            className={activeTab === 'exam' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'exam'}
            onClick={() => setActiveTab('exam')}
          >
            পরীক্ষার নোটিশ
          </button>
          <button
            type="button"
            className={activeTab === 'result' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'result'}
            onClick={() => setActiveTab('result')}
          >
            ফলাফল
          </button>
          <button
            type="button"
            className={activeTab === 'admit' ? 'active' : ''}
            role="tab"
            aria-selected={activeTab === 'admit'}
            onClick={() => setActiveTab('admit')}
          >
            প্রবেশপত্র
          </button>
        </div>

        <div role="tabpanel" aria-live="polite">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="home-notice"
              onClick={() => setActiveModal(item)}
            >
              <span className={`home-notice-type ${item.type}`}>{item.tag}</span>
              <span>
                <h3>
                  {item.title}
                  <span className="home-notice-sample-tag">নমুনা</span>
                </h3>
                <p>
                  {item.org} · {item.date}
                </p>
              </span>
              <HomeIcon name="arrow" />
            </button>
          ))}
        </div>
      </div>

      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 37, 29, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setActiveModal(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              border: '1px solid var(--home-line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`home-notice-type ${activeModal.type}`}>{activeModal.tag}</span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{
                  border: 0,
                  background: '#f0f4ed',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#65786b',
                }}
                aria-label="বন্ধ করুন"
              >
                ×
              </button>
            </div>
            <h3 id="modal-title" style={{ fontSize: '18px', fontWeight: 600, margin: '14px 0 8px' }}>
              {activeModal.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--home-muted)', margin: '0 0 16px' }}>
              {activeModal.org} · {activeModal.date}
            </p>
            <div
              style={{
                background: '#f7f9f4',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#405a65',
              }}
            >
              পরীক্ষার নোটিশ ও ফলাফল মডিউলটি চালুর কাজ চলছে। খুব শীঘ্রই সরাসরি অফিসিয়াল নোটিশ, ফলাফল ও প্রবেশপত্র ডাউনলোড ব্যবস্থা এখানে সংযুক্ত হবে।
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
