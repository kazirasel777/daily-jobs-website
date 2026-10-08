// File: components/InfoPage.tsx
import Breadcrumbs from '@/components/Breadcrumbs';

export default function InfoPage({ title, path, children }: { title: string; path: string; children: React.ReactNode }) {
  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="container-page max-w-3xl py-7 sm:py-9">
          <Breadcrumbs items={[{ name: title, path }]} />
          <h1 className="mt-4 font-serif text-[1.75rem] font-bold text-ink sm:text-4xl">{title}</h1>
        </div>
      </section>
      <div className="container-page max-w-3xl pt-8">
        <div className="prose-bn">{children}</div>
      </div>
    </>
  );
}
