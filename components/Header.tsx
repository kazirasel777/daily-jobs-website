'use client';

import HomeHeader from '@/components/home/HomeHeader';
import type { JobCategory } from '@/types/job';

export default function Header({ categories }: { categories?: JobCategory[] }) {
  return <HomeHeader />;
}
