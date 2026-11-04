// File: components/JobSourceList.tsx
// একটি চাকরির উৎস, মালিকের নির্ধারিত ক্রমে:
//   পত্রিকায় প্রকাশিত হলে:
//     পত্রিকা: দৈনিক প্রথম আলো · ৩ নভেম্বর ২০২৬ · পৃষ্ঠা ১১ · ই-পেপার দেখুন
//     অফিসিয়াল ওয়েবসাইট: rajbari.gov.bd
//     [মূল বিজ্ঞপ্তি দেখুন / প্রতিষ্ঠানের নিয়োগ পাতা দেখুন / অফিসিয়াল ওয়েবসাইট দেখুন]
//   শুধু অফিসিয়াল ওয়েবসাইটে পেলে:
//     অফিসিয়াল ওয়েবসাইট: জেলা প্রশাসকের কার্যালয় (rajbari.gov.bd) · ৩ নভেম্বর ২০২৬
//     [মূল বিজ্ঞপ্তি দেখুন / প্রতিষ্ঠানের নিয়োগ পাতা দেখুন / অফিসিয়াল ওয়েবসাইট দেখুন]
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

function url(v: string | null | undefined): string | null {
  return isHttpUrl(v) ? v : null;
}

const isPrint = (t: string) => t === 'newspaper' || t === 'epaper';

/** লিংক যেখানে নেয়, বাটনে তা-ই লেখা। ধরন জানা না থাকলে "নিয়োগ পাতা" — অনিশ্চিত লিংক কখনো "মূল বিজ্ঞপ্তি" নয়। */
export function noticeButtonLabel(src: PublicJobSource): string {
  if (src.button_label && src.notice_link_type) return src.button_label;
  if (src.notice_link_type === 'notice') return 'মূল বিজ্ঞপ্তি দেখুন';
  if (src.notice_link_type === 'website') return 'অফিসিয়াল ওয়েবসাইট দেখুন';
  return 'প্রতিষ্ঠানের নিয়োগ পাতা দেখুন';
}

/** "যেখানে খবর পেয়েছি" (discovery) মূল উৎস নয় — অ্যাপের মতোই বাদ। */
export function visibleSources(sources: PublicJobSource[] | undefined): PublicJobSource[] {
  return (sources ?? []).filter((src) => src.source_role !== 'discovery_source');
}

const linkCls = 'font-semibold text-brand-800 underline-offset-2 hover:underline break-words';

function Ext({ href, children, className = linkCls }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export default function JobSourceList({ sources }: { sources: PublicJobSource[] }) {
  return (
    <ul className="space-y-3">
      {sources.map((src) => {
        // পুরোনো API-তে name_url নেই — তখন source_url
        const nameUrl = url(src.name_url === undefined ? src.source_url : src.name_url);
        const noticeUrl = url(src.notice_url ?? (src.link_kind && src.link_kind !== 'none' ? src.button_url : null));
        const date = src.publication_date ? formatDateBn(src.publication_date) : null;

        let lines: React.ReactNode;
        if (isPrint(src.source_type)) {
          const page = pageText(src.printed_page);
          const site = url(src.website_url);
          lines = (
            <>
              <p>
                <span className="text-muted">পত্রিকা: </span>
                <span className="font-semibold text-ink break-words">{src.source_name}</span>
                {date && <span className="text-muted"> · {date}</span>}
                {page && <span className="text-muted"> · {page}</span>}
                {nameUrl && (
                  <>
                    <span className="text-muted"> · </span>
                    <Ext href={nameUrl}>ই-পেপার দেখুন</Ext>
                  </>
                )}
              </p>
              {site && (
                <p>
                  <span className="text-muted">অফিসিয়াল ওয়েবসাইট: </span>
                  <Ext href={site}>{domain(site) ?? site}</Ext>
                </p>
              )}
            </>
          );
        } else {
          const host = domain(nameUrl);
          lines = (
            <p>
              <span className="text-muted">অফিসিয়াল ওয়েবসাইট: </span>
              {nameUrl ? (
                <Ext href={nameUrl}>
                  {src.source_name}
                  {host && ` (${host})`}
                </Ext>
              ) : (
                <span className="font-semibold text-ink break-words">{src.source_name}</span>
              )}
              {date && <span className="text-muted"> · {date}</span>}
            </p>
          );
        }

        return (
          <li key={src.id} className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 text-sm text-ink-soft">
            <div className="min-w-0 space-y-0.5">{lines}</div>
            {noticeUrl && (
              <Ext
                href={noticeUrl}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-brand-600/40 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:border-brand-600"
              >
                {noticeButtonLabel(src)}
                <Icon name="external" className="h-3 w-3" />
              </Ext>
            )}
          </li>
        );
      })}
    </ul>
  );
}
