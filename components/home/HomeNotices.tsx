// File: components/home/HomeNotices.tsx
// প্রথম পাতায় সর্বশেষ নোটিশ / পরীক্ষার সময়সূচি। ডেটা না থাকলে অংশটা দেখায় না (নমুনা নয়)।
import Link from 'next/link';
import HomeIcon from './HomeIcons';
import { formatDateBn } from '@/lib/format';
import type { PublicNotice } from '@/types/notice';

export function noticeTone(notice: Pick<PublicNotice, 'type' | 'kind'>): 'exam' | 'result' | 'admit' {
  if (notice.type === 'result') return 'result';
  if (notice.kind === 'admit_card') return 'admit';
  return 'exam';
}

export default function HomeNotices({ notices }: { notices: PublicNotice[] }) {
  if (notices.length === 0) return null;

  return (
    <section className="home-section" id="notices" aria-labelledby="notices-heading">
      <div className="home-section-bar">
        <div className="home-section-heading">
          <h2 id="notices-heading">পরীক্ষার নোটিশ ও ফলাফল</h2>
        </div>
        <Link href="/notices" className="home-small-link">
          <HomeIcon name="bell" />
          সব নোটিশ
        </Link>
      </div>

      <div className="home-panel home-notice-panel">
        {notices.map((item) => (
          <Link key={item.id} href={`/notices#notice-${item.id}`} className="home-notice">
            <span className={`home-notice-type ${noticeTone(item)}`}>{item.kind_label}</span>
            <span>
              <h3>{item.title}</h3>
              <p>
                {[item.organization_name, item.event_date ? `পরীক্ষা ${formatDateBn(item.event_date)}` : formatDateBn(item.notice_date)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </span>
            <HomeIcon name="arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}
