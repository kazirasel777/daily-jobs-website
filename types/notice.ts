// File: types/notice.ts
// নোটিশ, পরীক্ষার সময়সূচি ও রেজাল্ট (/api/v1/notices)। চাকরি থেকে আলাদা।
// নতুন ঘরগুলো optional: পুরোনো API-তেও পাতা ভাঙে না।

export type NoticeType = 'notice' | 'result' | 'news';
export type NoticeKind = 'exam_schedule' | 'viva' | 'admit_card' | 'general';
/** null = স্বাভাবিক; প্রকাশের পরে কী ঘটেছে */
export type NoticeStatus = 'revised' | 'postponed' | 'cancelled';

export interface NoticeFeatureImage {
  url: string;
  alt: string;
}

export interface PublicNotice {
  id: number;
  /** "{id}-{english}" — /notices/{slug}। পুরোনো API-তে নেই, তখন id। */
  slug?: string | null;
  type: NoticeType;
  kind: NoticeKind | null;
  kind_label: string;
  title: string;
  summary?: string | null;
  organization_name: string | null;
  exam_name?: string | null;
  notice_date: string | null;
  event_date: string | null;
  event_end_date?: string | null;
  event_time?: string | null;
  event_venue?: string | null;
  notice_status?: NoticeStatus | null;
  notice_status_label?: string | null;
  status_note?: string | null;
  next_steps?: string | null;
  body: string;
  body_text: string;
  official_website: string | null;
  source_url: string | null;
  /** notice = এই নোটিশের নিজস্ব পেজ/PDF; career/null = প্রতিষ্ঠানের নোটিশ/নিয়োগ পাতা */
  notice_link_type?: 'notice' | 'career' | null;
  button_label?: string | null;
  /** প্রবেশপত্র ডাউনলোড / ফলাফল দেখার অফিসিয়াল লিংক */
  action_url?: string | null;
  action_label?: string | null;
  /** মূল নোটিশের ছবি/স্ক্যান (ফিচার ইমেজ নয়) */
  image_url: string | null;
  pdf_url: string | null;
  /** কার্ড ও সোশ্যাল প্রিভিউয়ের ছবি (১২০০×৬৭৫) */
  feature_image?: NoticeFeatureImage | null;
  published_at: string | null;
  updated_at?: string | null;
}

/** /api/v1/sitemap/notices */
export interface SitemapNoticeItem {
  id: number;
  slug: string;
  type: NoticeType;
  indexable: boolean;
  published_at: string | null;
  updated_at: string | null;
}
