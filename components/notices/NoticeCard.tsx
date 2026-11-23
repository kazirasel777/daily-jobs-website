// File: components/notices/NoticeCard.tsx
// তালিকার কার্ড: পুরো কার্ড নোটিশের নিজস্ব পাতায় নেয় (একটিই <a>, শিরোনামে)। মোবাইলে অনুভূমিক ছোট কার্ড।
import Link from 'next/link';
import HomeIcon from '@/components/home/HomeIcons';
import NoticeMedia from '@/components/notices/NoticeMedia';
import { formatDateBn } from '@/lib/format';
import { eventDateText, eventState, noticeDescription, noticeTone } from '@/lib/notice';
import { noticePath } from '@/lib/site';
import type { PublicNotice } from '@/types/notice';

export function NoticeStateChip({ notice }: { notice: PublicNotice }) {
  if (notice.notice_status && notice.notice_status_label) {
    return <span className={`nx-state ${notice.notice_status}`}>{notice.notice_status_label}</span>;
  }
  const state = eventState(notice);
  if (state.phase === 'none') return null;
  return <span className={`nx-state ${state.phase}`}>{state.label}</span>;
}

export default function NoticeCard({
  notice,
  headingLevel = 'h2',
  eager = false,
}: {
  notice: PublicNotice;
  headingLevel?: 'h2' | 'h3';
  eager?: boolean;
}) {
  const Heading = headingLevel;
  const state = eventState(notice);
  const classes = [
    'nx-card',
    `nx-tone-${noticeTone(notice)}`,
    state.phase === 'past' ? 'is-past' : '',
    notice.notice_status === 'cancelled' ? 'is-cancelled' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const when = notice.event_date
    ? { label: notice.kind === 'viva' ? 'ভাইভা' : 'পরীক্ষা', text: eventDateText(notice) }
    : null;

  return (
    <article className={classes}>
      <NoticeMedia notice={notice} eager={eager}>
        <div className="nx-media-chips">
          <span className="nx-chip on-media">{notice.kind_label}</span>
          <NoticeStateChip notice={notice} />
        </div>
      </NoticeMedia>
      <div className="nx-card-body">
        {notice.organization_name && (
          <p className="nx-card-org">
            <HomeIcon name="building" />
            <span>{notice.organization_name}</span>
          </p>
        )}
        <Heading>
          <Link href={noticePath(notice)} className="nx-card-link">
            {notice.title}
          </Link>
        </Heading>
        <p className="nx-card-summary">{noticeDescription(notice, 140)}</p>
        <div className="nx-card-foot">
          <span className="nx-chip nx-mobile-kind">{notice.kind_label}</span>
          {when ? (
            <span className="nx-when">
              <HomeIcon name="calendar" />
              {when.label} {when.text}
            </span>
          ) : (
            notice.notice_date && <span>নোটিশ {formatDateBn(notice.notice_date)}</span>
          )}
          <span className="sm:hidden">
            <NoticeStateChip notice={notice} />
          </span>
        </div>
      </div>
    </article>
  );
}
