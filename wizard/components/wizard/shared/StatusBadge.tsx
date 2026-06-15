import { cn } from '@/lib/utils'

type Status = 'pass' | 'warn' | 'fail' | 'running' | 'idle'

interface Props {
  status: Status
  children: React.ReactNode
  className?: string
}

const STYLES: Record<Status, string> = {
  pass:    'bg-green-50  text-green-700  border-green-200',
  warn:    'bg-amber-50  text-amber-700  border-amber-200',
  fail:    'bg-red-50    text-red-700    border-red-200',
  running: 'bg-blue-50   text-blue-700   border-blue-200',
  idle:    'bg-gray-50   text-gray-600   border-gray-200',
}

export function StatusBadge({ status, children, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
      STYLES[status], className
    )}>
      {children}
    </span>
  )
}
