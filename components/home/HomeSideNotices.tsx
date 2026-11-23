// File: components/home/HomeSideNotices.tsx
// হোমপেজের সাইডবারে ছোট "নোটিশ ও ফলাফল" কার্ড: সর্বশেষ ২টি নোটিশ, প্রতিটি নিজস্ব পাতায় নেয়;
// নিচের লিংক নোটিশ ও ফলাফল পাতায়। ডেটা না এলে শুধু শিরোনাম ও লিংক থাকে (নমুনা নয়)।
import Link from 'next/link';
import HomeIcon from './HomeIcons';
import { NoticeStateChip } from '@/components/notices/NoticeCard';
import { formatDateBn } from '@/lib/format';
import { eventDateText, noticeTone } from '@/lib/notice';
import { noticePath } from '@/lib/site';
import type { PublicNotice } from '@/types/notice';

export default function HomeSideNotices({ notices }: { notices: PublicNotice[] }) {
  const latest = notices.slice(0, 2);

  return (
    <section className="home-side-notices" aria-labelledby="side-notices-heading">
      <Link href="/notices" className="hsn-head">
        <span className="hsn-icon" aria-hidden="true">
          <HomeIcon name="bell" />
        </span>
        <span>
          <h2 id="side-notices-heading">নোটিশ ও ফলাফল</h2>
          <small>পরীক্ষার সময়সূচি, প্রবেশপত্র ও ফলাফল</small>
        </span>
      </Link>

      {latest.length > 0 && (
        <ul className="hsn-list">
          {latest.map((n) => (
            <li key={n.id} className={`nx-tone-${noticeTone(n)}`}>
              <Link href={noticePath(n)} className="hsn-item">
                <span className="hsn-chips">
                  <span className="nx-chip">{n.kind_label}</span>
                  <NoticeStateChip notice={n} />
                </span>
                <strong>{n.title}</strong>
                <small>
                  {[
                    n.organization_name,
                    n.event_date ? `${n.kind === 'viva' ? 'ভাইভা' : 'পরীক্ষা'} ${eventDateText(n)}` : formatDateBn(n.notice_date),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </small>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/notices" className="hsn-all">
        সব নোটিশ ও ফলাফল দেখুন
        <HomeIcon name="arrow" />
      </Link>
    </section>
  );
}
