'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWizardStore } from '@/lib/wizard-store'
import { cn } from '@/lib/utils'

const STEPS = [
  { num: 1, label: 'Connect tools' },
  { num: 2, label: 'Verify file' },
  { num: 3, label: 'Profile' },
  { num: 4, label: 'Extract tokens' },
  { num: 5, label: 'Validate' },
  { num: 6, label: 'Generate' },
  { num: 7, label: 'Export' },
]

export function WizardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentStep = parseInt(pathname.split('/').pop() ?? '1')
  const stepStatus = useWizardStore((s) => s.stepStatus)
  const progress = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)

  return (
    <div className="flex min-h-screen bg-[#0f0f10]">

      {/* ── Left panel ── */}
      <aside className="hidden lg:flex w-[300px] xl:w-[340px] shrink-0 flex-col sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">🧙‍♂️</span>
            <span className="text-white font-semibold text-[15px] tracking-tight">DS Wizard</span>
          </div>
        </div>

        {/* Steps nav */}
        <nav className="flex-1 px-6 space-y-1 overflow-y-auto">
          {STEPS.map((step, i) => {
            const status = stepStatus[step.num]
            const isDone = status === 'done'
            const isRunning = status === 'running'
            const isCurrent = step.num === currentStep
            // Reachable if step 1 (always) or ALL previous steps are done
            const isReachable = step.num === 1 || stepStatus[step.num - 1] === 'done'
            const isLocked = !isReachable

            return (
              <div key={step.num} className="relative">
                <Link
                  href={isReachable ? `/wizard/${step.num}` : '#'}
                  className={cn(
                    'flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-all duration-150',
                    isCurrent && 'bg-white/10',
                    !isCurrent && !isLocked && 'hover:bg-white/5',
                    isLocked && 'cursor-not-allowed pointer-events-none'
                  )}
                >
                  {/* Step indicator */}
                  <div className={cn(
                    'w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-200 z-10',
                    isDone && 'bg-[#9747FF] text-white',
                    isRunning && 'bg-[#9747FF]/30 text-[#9747FF] ring-2 ring-[#9747FF]/50 animate-pulse',
                    isCurrent && !isDone && !isRunning && 'bg-white text-[#0f0f10]',
                    !isCurrent && !isDone && !isRunning && !isLocked && 'bg-white/10 text-white/50',
                    isLocked && 'bg-white/5 text-white/20'
                  )}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : isRunning ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <circle cx="5" cy="5" r="4"/>
                      </svg>
                    ) : (
                      step.num
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    'text-[13px] font-medium transition-colors',
                    isCurrent && 'text-white',
                    isDone && !isCurrent && 'text-white/70',
                    !isCurrent && !isDone && !isLocked && 'text-white/40',
                    isLocked && 'text-white/20'
                  )}>
                    {step.label}
                  </span>
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Bottom tagline + progress */}
        <div className="px-8 py-8 space-y-5">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-medium text-white/40 tracking-wider uppercase">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#9747FF] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-[12px] text-white/25 leading-relaxed">
            figma-design-system-agent
          </p>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex-1 bg-[#fafafa] flex flex-col min-h-screen">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
          <span className="text-xl leading-none">🧙‍♂️</span>
          <span className="font-semibold text-sm text-gray-900">DS Wizard</span>
          <span className="ml-auto text-xs text-gray-400 font-medium">Step {currentStep} / {STEPS.length}</span>
        </div>

        {/* Step label header */}
        <div className="hidden lg:flex items-center justify-between px-10 pt-8 pb-0">
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <span className="font-semibold text-[#9747FF]">Step {currentStep}</span>
            <span>/</span>
            <span>{STEPS.length}</span>
            <span className="mx-1 text-gray-300">·</span>
            <span className="text-gray-500 font-medium">{STEPS[currentStep - 1]?.label}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-start justify-center px-6 py-8 lg:px-10 lg:py-10">
          <div className="w-full max-w-[520px] step-content">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
