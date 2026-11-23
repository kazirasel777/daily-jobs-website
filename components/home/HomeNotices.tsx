// File: components/home/HomeNotices.tsx
// প্রথম পাতায় সর্বশেষ নোটিশ / পরীক্ষার সময়সূচি / ফলাফল। প্রতিটি নোটিশের নিজস্ব পাতায় নেয়।
// ডেটা না থাকলে অংশটা দেখায় না (নমুনা নয়)।
import Link from 'next/link';
import HomeIcon from './HomeIcons';
import { NoticeStateChip } from '@/components/notices/NoticeCard';
import { formatDateBn } from '@/lib/format';
import { eventDateText } from '@/lib/notice';
import { noticePath } from '@/lib/site';
import type { PublicNotice } from '@/types/notice';

function homeTone(notice: Pick<PublicNotice, 'type' | 'kind'>): 'exam' | 'result' | 'admit' {
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
          <Link key={item.id} href={noticePath(item)} className="home-notice">
            <span className={`home-notice-type ${homeTone(item)}`}>{item.kind_label}</span>
            <span>
              <h3>{item.title}</h3>
              <p>
                {[item.organization_name, item.event_date ? `${item.kind === 'viva' ? 'ভাইভা' : 'পরীক্ষা'} ${eventDateText(item)}` : formatDateBn(item.notice_date)]
                  .filter(Boolean)
                  .join(' · ')}
                {(item.notice_status || item.event_date) && (
                  <span className="ml-1.5 inline-block align-middle text-[11px]">
                    <NoticeStateChip notice={item} />
                  </span>
                )}
              </p>
            </span>
            <HomeIcon name="arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}
