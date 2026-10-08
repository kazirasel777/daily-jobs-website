// File: components/DeadlineBadge.tsx
import Icon from '@/components/Icon';
import { deadlineStatus, type DeadlineTone } from '@/lib/format';

const TONES: Record<DeadlineTone, string> = {
  closed: 'bg-stone-100 text-stone-600 ring-stone-300',
  today: 'bg-alert-600 text-white ring-alert-600',
  urgent: 'bg-alert-50 text-alert-700 ring-alert-600/30',
  soon: 'bg-marigold-50 text-marigold-900 ring-marigold-500/40',
  open: 'bg-brand-50 text-brand-800 ring-brand-600/25',
  unknown: 'bg-stone-50 text-muted ring-line',
};

export default function DeadlineBadge({ deadline, precision, className = '' }: { deadline: string | null; precision?: string | null; className?: string }) {
  const status = deadlineStatus(deadline, precision);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${TONES[status.tone]} ${className}`}>
      <Icon name="clock" className="h-3.5 w-3.5" />
      {status.label}
    </span>
  );
}
