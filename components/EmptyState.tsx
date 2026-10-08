// File: components/EmptyState.tsx
import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: IconName;
  action?: { href: string; label: string };
}

export default function EmptyState({ title, body, icon = 'info', action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-serif text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted">{body}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          {action.label}
          <Icon name="arrowRight" />
        </Link>
      )}
    </div>
  );
}
