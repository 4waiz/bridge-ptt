import clsx from 'clsx';
import { STATUS_CLASSES, STATUS_LABELS } from '../../utils/status';

function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        STATUS_CLASSES[status] || 'bg-slate-100 text-slate-700 border-slate-200',
        className,
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default StatusBadge;

