'use client'

import { useRouter } from 'next/navigation'
import { useWizardStore, type OutputTier, type CssApproach, type Device } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Monitor, Smartphone, Tablet, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIERS: { value: OutputTier; label: string; desc: string; emoji: string }[] = [
  { value: 'static-file',   label: 'Static file',   desc: 'HTML + CSS, opens from disk. No server needed.',  emoji: '📄' },
  { value: 'static-site',   label: 'Static site',   desc: 'Modern ES modules, needs a simple HTTP server.',  emoji: '🌐' },
  { value: 'framework-app', label: 'Framework app', desc: 'React / Vue / Svelte with a build step.',         emoji: '⚙️' },
]

const CSS_OPTS: { value: CssApproach; label: string }[] = [
  { value: 'plain-css', label: 'Plain CSS' },
  { value: 'tailwind',  label: 'Tailwind CSS' },
  { value: 'scss',      label: 'SCSS' },
]

const DEVICES: { value: Device; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'mobile',  label: 'Mobile',  Icon: Smartphone },
  { value: 'tablet',  label: 'Tablet',  Icon: Tablet },
  { value: 'desktop', label: 'Desktop', Icon: Monitor },
]

export function Step3Profile() {
  const { profile, setProfile, setStepStatus, setCurrentStep } = useWizardStore()
  const router = useRouter()

  function toggleDevice(d: Device) {
    const devices = profile.devices.includes(d)
      ? profile.devices.filter((x) => x !== d)
      : [...profile.devices, d]
    setProfile({ devices })
  }

  function proceed() {
    setStepStatus(3, 'done')
    setCurrentStep(4)
    router.push('/wizard/4')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configure your project</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Tell us what kind of code to generate.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-[13px] font-medium">Output type</Label>
        <div className="space-y-2">
          {TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setProfile({ tier: t.value })}
              className={cn(
                'w-full rounded-2xl border-2 p-4 text-left transition-all duration-150',
                profile.tier === t.value
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1">
                  <p className={cn('text-[13px] font-semibold', profile.tier === t.value ? 'text-primary' : 'text-foreground')}>
                    {t.label}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center',
                  profile.tier === t.value ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {profile.tier === t.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[13px] font-medium">CSS approach</Label>
        <div className="flex gap-2">
          {CSS_OPTS.map((c) => (
            <button
              key={c.value}
              onClick={() => setProfile({ cssApproach: c.value })}
              className={cn(
                'flex-1 rounded-xl border-2 py-2.5 text-[13px] font-medium transition-all',
                profile.cssApproach === c.value
                  ? 'border-primary bg-accent text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[13px] font-medium">Target devices</Label>
        <div className="flex gap-2">
          {DEVICES.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => toggleDevice(value)}
              className={cn(
                'flex-1 rounded-xl border-2 py-3.5 flex flex-col items-center gap-2 transition-all',
                profile.devices.includes(value)
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
            >
              <Icon className={cn('w-4 h-4', profile.devices.includes(value) ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-[12px] font-medium', profile.devices.includes(value) ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <Checkbox
          id="showcase"
          checked={profile.showcaseAutoUpdate}
          onCheckedChange={(v) => setProfile({ showcaseAutoUpdate: !!v })}
          className="mt-0.5"
        />
        <div>
          <Label htmlFor="showcase" className="text-[13px] font-medium cursor-pointer">
            Auto-update component gallery
          </Label>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Rebuild the showcase page after each generated component.
          </p>
        </div>
      </div>

      <Button
        onClick={proceed}
        disabled={profile.devices.length === 0}
        className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white"
      >
        Continue <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  )
}
