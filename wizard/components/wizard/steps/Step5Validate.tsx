'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { SkillStream } from '@/components/wizard/shared/SkillStream'
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Step5Validate() {
  const { figmaToken, aiApiKey, aiProvider, aiModel, figmaFileUrl, setStepStatus, setCurrentStep } = useWizardStore()
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)
  const [hasBlockers, setHasBlockers] = useState(false)
  const router = useRouter()

  async function runValidation() {
    setStreaming(true)
    setOutput('')
    setDone(false)
    setStepStatus(5, 'running')
    const res = await fetch('/api/run-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: 'validate-extraction', inputs: { figmaFileUrl }, figmaToken, aiApiKey, aiProvider, aiModel }),
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (reader) {
      const { done: sd, value } = await reader.read()
      if (sd) break
      full += decoder.decode(value)
      setOutput(full)
    }
    setHasBlockers(full.toLowerCase().includes('fail'))
    setStreaming(false)
    setDone(true)
    setStepStatus(5, 'done')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Validate extraction</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Cross-checking extracted data against live Figma.
        </p>
      </div>

      {!streaming && !done && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-medium">Ready to validate</p>
            <p className="text-[12px] text-muted-foreground mt-1">This usually takes 20-40 seconds.</p>
          </div>
          <Button onClick={runValidation} className="bg-[#9747FF] hover:bg-[#8035f0] text-white h-10 px-6">
            Run validation
          </Button>
        </div>
      )}

      {output && <SkillStream output={output} running={streaming} />}

      {done && (
        <div className="space-y-4">
          <div className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            hasBlockers ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
          )}>
            {hasBlockers
              ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
            <span className={cn('text-[13px] font-medium', hasBlockers ? 'text-amber-700' : 'text-green-700')}>
              {hasBlockers ? 'Validation found issues' : 'Validation passed'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setCurrentStep(6); router.push('/wizard/6') }}
              className="flex-1 h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
              Continue to Generate <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            {hasBlockers && (
              <Button variant="outline" onClick={() => { setCurrentStep(6); router.push('/wizard/6') }} className="h-10 px-4 text-[13px]">
                Ignore & continue
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
