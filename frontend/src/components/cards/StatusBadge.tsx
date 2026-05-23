type Status = 'pending' | 'briefed' | 'interviewed' | 'pass' | 'fail'

interface StatusBadgeProps {
  status: Status | string
}

const config: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-slate-100 text-slate-600',
  },
  briefed: {
    label: 'Briefed',
    className: 'bg-indigo-100 text-indigo-700',
  },
  interviewed: {
    label: 'Interviewed',
    className: 'bg-emerald-100 text-emerald-700',
  },
  pass: {
    label: 'Pass ✓',
    className: 'bg-emerald-100 text-emerald-700',
  },
  fail: {
    label: 'Fail ✕',
    className: 'bg-red-100 text-red-600',
  },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = config[status] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}
