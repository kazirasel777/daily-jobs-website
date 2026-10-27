// File: types/job.ts

export interface JobCategory {
  slug: string;
  name: string;
}

export interface JobListItem {
  id: number;
  slug: string;
  title: string;
  organization_name: string | null;
  category: JobCategory | null;
  vacancies: number | null;
  location: string | null;
  circular_published_date: string | null;
  apply_start_date: string | null;
  deadline: string | null;
  days_left: number | null;
  published_at: string | null;
  updated_at?: string | null;
  recently_added: boolean;
  thumbnail_url: string | null;
  /** Older API builds omit these; treat missing as active. */
  availability?: JobAvailability;
  application_open?: boolean;
}

export type JobAvailability = 'active' | 'recently_expired' | 'expired' | 'archived';

export interface CircularImage {
  page_number: number;
  url: string | null;
}

export interface JobDetailSeo {
  title: string | null;
  description: string | null;
}

export interface PublicJobSource {
  id: number;
  source_name: string;
  source_role: 'original_notice' | 'issuing_authority' | 'discovery_source' | 'other' | string;
  source_type: string;
  source_url: string | null;
  publication_date: string | null;
  printed_page: string | null;
  is_verified: boolean;
}

export interface DirectorySourceItem {
  source_name: string;
  source_role: string;
  source_type: string;
  source_url: string | null;
  is_verified: boolean;
  job_count: number;
  latest_date: string | null;
  categories: Array<{ slug: string; name: string }>;
  recent_jobs: Array<{
    id: number;
    slug: string;
    title: string;
    deadline: string | null;
    availability?: JobAvailability;
  }>;
}

export interface JobDetail extends JobListItem {
  deadline_precision: string | null;
  application_method: string | null;
  apply_link: string | null;
  application_instructions: string | null;
  description: string | null;
  circular_images: CircularImage[];
  seo: JobDetailSeo;
  updated_at: string | null;
  sources?: PublicJobSource[];
}

export interface PaginationMeta {
  current_page: number;
  from?: number | null;
  last_page: number;
  per_page?: number;
  to?: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: Record<string, string | null>;
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  data: T;
}

export interface Topic {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export interface Subject {
  id: number;
  name: string;
  slug: string;
  question_count: number;
  topics: Topic[];
}

export interface QuestionCollection {
  id: number;
  slug: string;
  name: string;
  type: string;
  job_post_id: number | null;
  question_count: number;
}

export interface QuestionStimulus {
  id: number;
  kind: string;
  title: string | null;
  body: string;
}

export interface Question {
  id: number;
  type: string;
  origin: string; // past_exam | admin_written | agent_generated
  question_text: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  stimulus: QuestionStimulus | null;
  correct_option?: string;
  explanation?: string | null;
}

export interface CurrentAffair {
  id: number;
  question: string;
  answer: string;
  affair_date: string | null;
  category: string | null;
  linked_question_count: number;
}
