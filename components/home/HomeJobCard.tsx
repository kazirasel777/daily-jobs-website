// File: components/home/HomeJobCard.tsx
import Link from 'next/link';
import HomeIcon from './HomeIcons';
import { formatDateBn, toBnNumber } from '@/lib/format';
import { jobPath } from '@/lib/site';
import type { JobListItem } from '@/types/job';

interface HomeJobCardProps {
  job: JobListItem;
}

function getTonePalette(categorySlug?: string) {
  if (!categorySlug) return { bg: '#e9efe6', fg: '#355e48', toneClass: '' };
  if (categorySlug.includes('bank')) return { bg: '#e9edf2', fg: '#3c5876', toneClass: 'bank' };
  if (categorySlug.includes('private') || categorySlug.includes('company')) {
    return { bg: '#f6f0e8', fg: '#7c6750', toneClass: 'private' };
  }
  if (categorySlug.includes('ngo')) return { bg: '#f5eff7', fg: '#846294', toneClass: 'ngo' };
  return { bg: '#e9efe6', fg: '#355e48', toneClass: '' };
}

export default function HomeJobCard({ job }: HomeJobCardProps) {
  const href = jobPath(job);
  const palette = getTonePalette(job.category?.slug);
  const org = job.organization_name || job.category?.name || 'চাকরির বিজ্ঞপ্তি';
  const vacanciesText =
    job.vacancies !== null && job.vacancies > 0
      ? `${toBnNumber(job.vacancies)} জন নিয়োগ`
      : 'নিয়োগ বিজ্ঞপ্তি';

  return (
    <article className="home-job-card">
      <Link className="home-card-link" href={href} aria-label={job.title}>
        <div className="home-job-visual">
          {job.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.thumbnail_url}
              alt=""
              width={248}
              height={186}
              loading="lazy"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="320"
              height="240"
              viewBox="0 0 320 240"
              aria-hidden="true"
            >
              <rect width="320" height="240" fill={palette.bg} />
              <circle cx="282" cy="27" r="76" fill={palette.fg} opacity="0.055" />
              <path d="M0 227h320v13H0Z" fill={palette.fg} opacity="0.13" />
              <g transform="translate(22 19)" stroke={palette.fg} fill="none" strokeWidth="2">
                <circle cx="20" cy="20" r="20" opacity="0.3" />
                <path d="m7 17 13-7 13 7H7Zm3 14h20M13 20v8m7-8v8m7-8v8" />
              </g>
              <text x="23" y="99" fill={palette.fg} fontFamily="inherit" fontSize="18" fontWeight="600">
                {org.length > 20 ? org.slice(0, 19) + '…' : org}
              </text>
              <text x="23" y="129" fill={palette.fg} fontFamily="inherit" fontSize="23" fontWeight="700">
                নিয়োগ বিজ্ঞপ্তি
              </text>
              <rect x="23" y="153" rx="5" width="130" height="32" fill={palette.fg} />
              <text x="88" y="175" textAnchor="middle" fill="white" fontFamily="inherit" fontSize="15">
                {vacanciesText}
              </text>
              <text x="24" y="213" fill={palette.fg} opacity="0.62" fontFamily="inherit" fontSize="11">
                দৈনিক চাকরি
              </text>
            </svg>
          )}
        </div>

        <div className="home-job-copy">
          <div className="home-card-top">
            <span className={`home-tag ${palette.toneClass}`}>
              {job.category?.name || 'চাকরি'}
            </span>
            {job.recently_added && <span className="home-new">নতুন</span>}
          </div>

          <h3 className="home-job-title">{job.title}</h3>

          <div className="home-job-facts">
            {job.circular_published_date && (
              <span className="published">
                প্রকাশ {formatDateBn(job.circular_published_date)}
              </span>
            )}
            {job.circular_published_date && job.vacancies !== null && job.vacancies > 0 && (
              <span className="sep" />
            )}
            {job.vacancies !== null && job.vacancies > 0 && (
              <span className="vacancies">
                নিয়োগ {toBnNumber(job.vacancies)} জন
              </span>
            )}
          </div>

          <div className="home-card-bottom">
            <span className="home-deadline">
              <HomeIcon name="calendar" />
              আবেদন শেষ <strong>{job.deadline ? formatDateBn(job.deadline) : 'চলমান'}</strong>
            </span>
            <span className="home-views" aria-label="দেখা হয়েছে —">
              <HomeIcon name="eye" />
              —
              <HomeIcon name="arrow" className="arrow" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
