// File: types/notice.ts
// নোটিশ, পরীক্ষার সময়সূচি ও রেজাল্ট (/api/v1/notices)। চাকরি থেকে আলাদা।

export type NoticeType = 'notice' | 'result' | 'news';
export type NoticeKind = 'exam_schedule' | 'viva' | 'admit_card' | 'general';

export interface PublicNotice {
  id: number;
  type: NoticeType;
  kind: NoticeKind | null;
  kind_label: string;
  title: string;
  organization_name: string | null;
  notice_date: string | null;
  event_date: string | null;
  body: string;
  body_text: string;
  official_website: string | null;
  source_url: string | null;
  /** notice = এই নোটিশের নিজস্ব পেজ/PDF; career/null = প্রতিষ্ঠানের নোটিশ/নিয়োগ পাতা */
  notice_link_type?: 'notice' | 'career' | null;
  button_label?: string | null;
  image_url: string | null;
  pdf_url: string | null;
  published_at: string | null;
}
