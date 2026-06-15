import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  filename: string
  size?: string
  lines?: number
  className?: string
  onClick?: () => void
}

export function ArtifactCard({ filename, size, lines, className, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:bg-muted/50 transition-colors w-full group',
        className
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground truncate">{filename}</p>
        {(size || lines) && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {[size, lines ? `${lines} lines` : null].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </button>
  )
}
