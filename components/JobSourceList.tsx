// File: components/JobSourceList.tsx
// একটি চাকরির উৎস, এক লাইনে:
//   উৎস: দৈনিক প্রথম আলো · ২ নভেম্বর ২০২৬ · পৃষ্ঠা ১১        [মূল বিজ্ঞপ্তি দেখুন]
//   উৎস: অফিশিয়াল ওয়েবসাইট (rajbari.gov.bd) · ৩ নভেম্বর ২০২৬  [মূল বিজ্ঞপ্তি দেখুন]
// নামে চাপলে পত্রিকা/ই-পেপার বা অফিশিয়াল সাইট খোলে; বাটন শুধু বিজ্ঞপ্তির নিজস্ব পেজ/PDF থাকলে।
// জব পেজ ও /sources দুই জায়গায় একই।
import Icon from '@/components/Icon';
import { formatDateBn, isHttpUrl, toBnDigits } from '@/lib/format';
import type { PublicJobSource } from '@/types/job';

function pageText(page: string | null): string | null {
  if (!page?.trim()) return null;
  const p = page.trim();
  return p.startsWith('পৃষ্ঠা') ? toBnDigits(p) : `পৃষ্ঠা ${toBnDigits(p)}`;
}

function domain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function sourceLabel(src: PublicJobSource, nameUrl: string | null): string {
  if (src.source_type === 'website' || src.source_type === 'official_notice') {
    const host = domain(nameUrl ?? src.source_url);
    return host ? `অফিশিয়াল ওয়েবসাইট (${host})` : `অফিশিয়াল ওয়েবসাইট: ${src.source_name}`;
  }
  if (src.source_type === 'epaper' && !src.source_name.includes('ই-পেপার')) return `${src.source_name} (ই-পেপার)`;
  return src.source_name;
}

/** "যেখানে খবর পেয়েছি" (discovery) মূল উৎস নয় — অ্যাপের মতোই বাদ। */
export function visibleSources(sources: PublicJobSource[] | undefined): PublicJobSource[] {
  return (sources ?? []).filter((src) => src.source_role !== 'discovery_source');
}

export default function JobSourceList({ sources }: { sources: PublicJobSource[] }) {
  return (
    <ul className="space-y-2">
      {sources.map((src) => {
        // পুরোনো API-তে name_url নেই — তখন source_url
        const rawName = src.name_url === undefined ? src.source_url : src.name_url;
        const nameUrl = isHttpUrl(rawName) ? rawName : null;
        const rawNotice = src.notice_url ?? (src.link_kind === 'notice' ? src.button_url : null);
        const noticeUrl = isHttpUrl(rawNotice) ? rawNotice : null;
        const label = sourceLabel(src, nameUrl);
        const page = pageText(src.printed_page);

        return (
          <li key={src.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <p className="min-w-0 text-sm text-ink-soft">
              <span className="text-muted">উৎস: </span>
              {nameUrl ? (
                <a href={nameUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 underline-offset-2 hover:underline break-words">
                  {label}
                </a>
              ) : (
                <span className="font-semibold text-ink break-words">{label}</span>
              )}
              {src.is_verified && <span className="ml-1 text-xs text-brand-700" title="মূল বিজ্ঞপ্তির সাথে মিলিয়ে দেখা হয়েছে">✓</span>}
              {src.publication_date && <span className="text-muted"> · {formatDateBn(src.publication_date)}</span>}
              {page && <span className="text-muted"> · {page}</span>}
            </p>

            {noticeUrl && (
              <a
                href={noticeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-600/40 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:border-brand-600"
              >
                মূল বিজ্ঞপ্তি দেখুন
                <Icon name="external" className="h-3 w-3" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
