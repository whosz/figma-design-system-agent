import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  output: string
  running: boolean
  className?: string
}

export function SkillStream({ output, running, className }: Props) {
  const ref = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [output])

  return (
    <div className={cn('rounded-xl border border-border overflow-hidden bg-gray-950', className)}>
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-white/5">
        <div className={cn('w-1.5 h-1.5 rounded-full', running ? 'bg-emerald-400 animate-pulse' : 'bg-white/20')} />
        <span className="text-[11px] font-medium text-white/40 tracking-wide uppercase">
          {running ? 'Running' : 'Output'}
        </span>
      </div>
      <pre
        ref={ref}
        className="p-4 text-[12px] text-gray-300 font-mono overflow-auto max-h-56 whitespace-pre-wrap break-words leading-relaxed"
      >
        {output || (running ? '…' : '')}
      </pre>
    </div>
  )
}
