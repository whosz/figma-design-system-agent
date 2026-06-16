'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { SkillStream } from '@/components/wizard/shared/SkillStream'
import { CheckCircle2, Loader2, ArrowRight, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEMO_COMPONENTS = [
  { id: 'button', name: 'Button', states: ['default', 'hover', 'focus', 'pressed', 'disabled'], variants: ['primary', 'secondary', 'ghost'] },
  { id: 'input',  name: 'Input',  states: ['default', 'focus', 'error', 'disabled'],             variants: ['text', 'password'] },
  { id: 'card',   name: 'Card',   states: ['default', 'hover'],                                  variants: ['default', 'elevated'] },
  { id: 'badge',  name: 'Badge',  states: ['default'],                                           variants: ['neutral', 'success', 'error', 'warning'] },
]

export function Step6Generate() {
  const { figmaToken, aiApiKey, aiProvider, aiModel, figmaDataMode, figmaFileUrl, profile, markComponentGenerated, setStepStatus, setCurrentStep } = useWizardStore()
  const [selected, setSelected] = useState<Set<string>>(new Set(DEMO_COMPONENTS.map((c) => c.id)))
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated] = useState<Set<string>>(new Set())
  const [currentOutput, setCurrentOutput] = useState('')
  const router = useRouter()

  function toggle(id: string) {
    if (generated.has(id)) return
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function generateAll() {
    const toGenerate = DEMO_COMPONENTS.filter((c) => selected.has(c.id) && !generated.has(c.id))
    for (const comp of toGenerate) {
      setGenerating(comp.id)
      setCurrentOutput('')
      const res = await fetch('/api/run-skill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: 'generate-component', inputs: { component: comp.name, figmaFileUrl, profile }, figmaToken, aiApiKey, aiProvider, aiModel, figmaDataMode }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setCurrentOutput(full)
      }
      setGenerated((g) => new Set([...g, comp.id]))
      markComponentGenerated(comp.id)
      setGenerating(null)
    }
    setStepStatus(6, 'done')
  }

  const allDone = DEMO_COMPONENTS.filter((c) => selected.has(c.id)).every((c) => generated.has(c.id))
  const progress = selected.size > 0 ? Math.round((generated.size / selected.size) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate components</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Select which components to generate. All states and variants will be implemented.
        </p>
      </div>

      <div className="space-y-2">
        {DEMO_COMPONENTS.map((comp) => {
          const isDone = generated.has(comp.id)
          const isGenerating = generating === comp.id
          const isSelected = selected.has(comp.id)

          return (
            <div
              key={comp.id}
              onClick={() => toggle(comp.id)}
              className={cn(
                'flex items-center gap-4 rounded-2xl border-2 p-4 cursor-pointer transition-all duration-150',
                isDone
                  ? 'border-green-200 bg-green-50/60 cursor-default'
                  : isSelected
                    ? 'border-primary/40 bg-accent'
                    : 'border-border bg-card hover:border-muted-foreground/30'
              )}
            >
              <div className="shrink-0">
                {isDone
                  ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                  : isGenerating
                    ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    : <Checkbox checked={isSelected} className="pointer-events-none" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-[13px] font-medium', isDone ? 'text-green-700' : 'text-foreground')}>
                  {comp.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {comp.states.join(' · ')}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                {comp.variants.length} variants
              </span>
            </div>
          )
        })}
      </div>

      {generating && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>Generating <strong className="text-foreground">{generating}</strong>...</span>
            <span>{generated.size} / {selected.size}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <SkillStream output={currentOutput} running />
        </div>
      )}

      {!allDone && !generating && (
        <Button onClick={generateAll} disabled={selected.size === 0}
          className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
          <Wand2 className="w-4 h-4 mr-2" />
          Generate {selected.size} component{selected.size !== 1 ? 's' : ''}
        </Button>
      )}

      {allDone && (
        <Button onClick={() => { setCurrentStep(7); router.push('/wizard/7') }}
          className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
          Continue to Export <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      )}
    </div>
  )
}
