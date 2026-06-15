'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SkillStream } from '@/components/wizard/shared/SkillStream'
import { Layers, Component, ArrowRight, Sparkles } from 'lucide-react'

export function Step4Extract() {
  const { figmaToken, aiApiKey, aiProvider, aiModel, figmaFileUrl, profile, setTokenCount, setComponentEntries, setStepStatus, setCurrentStep } = useWizardStore()
  const [streaming, setStreaming] = useState(false)
  const [output, setOutput] = useState('')
  const [done, setDone] = useState(false)
  const [counts, setCounts] = useState({ tokens: 0, components: 0 })
  const router = useRouter()

  async function runExtraction() {
    setStreaming(true)
    setOutput('')
    setDone(false)
    setStepStatus(4, 'running')
    const res = await fetch('/api/run-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill: 'extract-design-system', inputs: { figmaFileUrl, profile }, figmaToken, aiApiKey, aiProvider, aiModel }),
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let full = ''
    let c = { tokens: 0, components: 0 }
    while (reader) {
      const { done: sd, value } = await reader.read()
      if (sd) break
      full += decoder.decode(value)
      setOutput(full)
      const tm = full.match(/tokens extracted: (\d+)/i)
      const cm = full.match(/components found: (\d+)/i)
      c = { tokens: tm ? parseInt(tm[1]) : c.tokens, components: cm ? parseInt(cm[1]) : c.components }
      setCounts({ ...c })
    }
    setTokenCount(c.tokens)
    setComponentEntries([])
    setStreaming(false)
    setDone(true)
    setStepStatus(4, 'done')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Extract design tokens</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pulling colors, typography, spacing and components from Figma.
        </p>
      </div>

      {!streaming && !done && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-medium">Ready to extract</p>
            <p className="text-[12px] text-muted-foreground mt-1 break-all">{figmaFileUrl || 'No file URL set'}</p>
          </div>
          <Button onClick={runExtraction} className="bg-[#9747FF] hover:bg-[#8035f0] text-white h-10 px-6">
            Start extraction
          </Button>
        </div>
      )}

      {(streaming || done) && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Layers,    label: 'tokens found',     value: counts.tokens },
            { icon: Component, label: 'components found', value: counts.components },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {streaming && <Progress value={null} className="h-1" />}
      {output && <SkillStream output={output} running={streaming} />}

      {done && (
        <Button onClick={() => { setCurrentStep(5); router.push('/wizard/5') }}
          className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
          Validate extraction <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      )}
    </div>
  )
}
