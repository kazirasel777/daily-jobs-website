// File: components/home/HomeFooter.tsx
import Footer from '@/components/Footer';
import type { JobCategory } from '@/types/job';

export default function HomeFooter({ categories }: { categories?: JobCategory[] }) {
  return <Footer categories={categories} />;
}
