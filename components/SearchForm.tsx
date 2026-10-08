// File: components/SearchForm.tsx
import Icon from '@/components/Icon';

/** Plain GET form: works without JavaScript and keeps results shareable. */
export default function SearchForm({ defaultValue = '', autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="job-search" className="sr-only">পদ, প্রতিষ্ঠান বা বিভাগের নাম</label>
      <div className="flex flex-1 items-center rounded-xl border border-line-strong bg-surface shadow-sm focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
        <Icon name="search" className="ml-4 h-5 w-5 shrink-0 text-muted" />
        <input
          id="job-search"
          type="search"
          name="q"
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          maxLength={100}
          placeholder="যেমন: অফিস সহায়ক, সোনালী ব্যাংক, শিক্ষক"
          className="w-full bg-transparent px-3 py-3.5 text-base text-ink placeholder:text-muted/80 focus:outline-none"
        />
      </div>
      <button type="submit" className="rounded-xl bg-brand-800 px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-brand-700">
        খুঁজুন
      </button>
    </form>
  );
}
