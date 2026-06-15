'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkillStream } from '@/components/wizard/shared/SkillStream'
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Verdict = 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY' | null

const VERDICT_CFG = {
  READY:               { Icon: CheckCircle2, cls: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Ready to extract' },
  READY_WITH_WARNINGS: { Icon: AlertTriangle, cls: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Ready with warnings' },
  NOT_READY:           { Icon: XCircle,      cls: 'text-red-600',   bg: 'bg-red-50 border-red-200',     label: 'Not ready' },
}

export function Step2Readiness() {
  const { figmaToken, aiApiKey, aiProvider, aiModel, figmaFileUrl, setFigmaFileUrl, setStepStatus, setCurrentStep } = useWizardStore()
  const [url, setUrl] = useState(figmaFileUrl)
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [verdict, setVerdict] = useState<Verdict>(null)
  const router = useRouter()

  async function runCheck() {
    if (!url.trim()) return
    setFigmaFileUrl(url.trim())
    setStreaming(true)
    setOutput('')
    setVerdict(null)
    setStepStatus(2, 'running')

    const res = await fetch('/api/run-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: 'figma-readiness-check', inputs: { figmaFileUrl: url.trim() }, figmaToken, aiApiKey, aiProvider, aiModel }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value)
      setOutput(full)
    }

    setVerdict(full.includes('NOT READY') ? 'NOT_READY' : full.includes('READY WITH WARNINGS') ? 'READY_WITH_WARNINGS' : 'READY')
    setStreaming(false)
    setStepStatus(2, 'done')
  }

  function proceed(force = false) {
    if (!force && verdict === 'NOT_READY') return
    setCurrentStep(3)
    router.push('/wizard/3')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify your Figma file</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Paste the URL and we will check if the file is ready for extraction.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runCheck()}
          placeholder="https://figma.com/design/..."
          className="h-10 text-[13px]"
        />
        <Button onClick={runCheck} disabled={streaming || !url.trim()} variant="outline" className="h-10 shrink-0 px-5">
          {streaming ? 'Checking...' : 'Check'}
        </Button>
      </div>

      {output && (
        <div className="space-y-4">
          {verdict && (() => {
            const cfg = VERDICT_CFG[verdict]
            return (
              <div className={cn('flex items-center gap-2.5 rounded-xl border px-4 py-3', cfg.bg)}>
                <cfg.Icon className={cn('w-4 h-4 shrink-0', cfg.cls)} />
                <span className={cn('text-[13px] font-medium', cfg.cls)}>{cfg.label}</span>
              </div>
            )
          })()}
          <SkillStream output={output} running={streaming} />
        </div>
      )}

      {verdict && (
        <div className="flex gap-2 pt-1">
          <Button onClick={() => proceed()} disabled={verdict === 'NOT_READY'}
            className="flex-1 h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
            Continue <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
          {verdict === 'NOT_READY' && (
            <Button variant="outline" onClick={() => proceed(true)} className="h-10 px-4 text-[13px]">
              Ignore & continue
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
