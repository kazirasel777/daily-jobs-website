// File: components/notices/NoticeMedia.tsx
// ফিচার ইমেজ থাকলে সেটি; না থাকলে ধরনের রঙে ব্র্যান্ডেড টাইল (প্রতিষ্ঠানের সংক্ষেপ + ধরন + তারিখ)।
// ছবি না থাকায় নোটিশ কখনো ফাঁকা বা ভাঙা দেখায় না।
import { formatDateBn } from '@/lib/format';
import { orgMonogram } from '@/lib/notice';
import type { PublicNotice } from '@/types/notice';

export default function NoticeMedia({
  notice,
  eager = false,
  children,
}: {
  notice: PublicNotice;
  eager?: boolean;
  children?: React.ReactNode;
}) {
  const image = notice.feature_image?.url ? notice.feature_image : null;
  const dateIso = notice.event_date || notice.notice_date;
  const [day, month] = dateIso ? formatDateBn(dateIso).split(' ') : [];

  return (
    <div className="nx-media">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.alt || notice.title}
          width={1200}
          height={675}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <div className="nx-tile" aria-hidden="true">
          <span className="nx-tile-org">{orgMonogram(notice.organization_name) || notice.kind_label}</span>
          <span className="nx-tile-kind">{notice.kind_label}</span>
          {day && month && (
            <span className="nx-tile-date">
              <b>{day}</b>
              <small>{month}</small>
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
