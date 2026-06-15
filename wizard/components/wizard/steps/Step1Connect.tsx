'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore, type AiProvider } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Eye, EyeOff, Figma, Key, ExternalLink,
  CheckCircle2, AlertCircle, Loader2, ChevronDown,
} from 'lucide-react'

/* ── Provider catalogue ── */
type ProviderDef = {
  id: AiProvider
  name: string
  logo: string
  placeholder: string
  docsUrl: string
  mcp: boolean        // supports Figma MCP
  models: { id: string; label: string }[]
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '🟣',
    placeholder: 'sk-ant-api03-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    mcp: true,
    models: [
      { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 (recommended)' },
      { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5 (fast & cheap)' },
      { id: 'claude-opus-4-8',            label: 'Claude Opus 4.8 (most capable)' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '⚫',
    placeholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    mcp: false,
    models: [
      { id: 'gpt-4o',       label: 'GPT-4o' },
      { id: 'gpt-4o-mini',  label: 'GPT-4o mini (fast & cheap)' },
      { id: 'o3-mini',      label: 'o3-mini' },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    logo: '🔵',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
    mcp: false,
    models: [
      { id: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.5-pro-latest', label: 'Gemini 2.5 Pro' },
    ],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    logo: '🐙',
    placeholder: 'ghp_... or gho_...',
    docsUrl: 'https://github.com/settings/tokens',
    mcp: false,
    models: [
      { id: 'gpt-4o',          label: 'GPT-4o (via Copilot API)' },
      { id: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via Copilot API)' },
      { id: 'o3-mini',         label: 'o3-mini (via Copilot API)' },
    ],
  },
]

type FigmaMode = 'oauth' | 'pat'

export function Step1Connect() {
  const [provider, setProvider] = useState<ProviderDef>(PROVIDERS[0])
  const [model, setModel] = useState(PROVIDERS[0].models[0].id)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [validating, setValidating] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [apiKeyError, setApiKeyError] = useState('')

  const [figmaMode, setFigmaMode] = useState<FigmaMode>('pat')
  const [oauthAvailable, setOauthAvailable] = useState<boolean | null>(null)
  const [pat, setPat] = useState('')
  const [patError, setPatError] = useState('')

  const { setFigmaToken, setAiCredentials, setStepStatus, setCurrentStep } = useWizardStore()

  useEffect(() => {
    fetch('/api/auth/figma-configured')
      .then((r) => r.json())
      .then(({ configured }) => {
        setOauthAvailable(configured)
        if (configured) setFigmaMode('oauth')
      })
      .catch(() => setOauthAvailable(false))
  }, [])
  const router = useRouter()

  function selectProvider(p: ProviderDef) {
    setProvider(p)
    setModel(p.models[0].id)
    setApiKey('')
    setApiKeyValid(null)
    setApiKeyError('')
  }

  async function validateKey(key: string): Promise<boolean> {
    setValidating(true)
    setApiKeyValid(null)
    setApiKeyError('')
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider: provider.id }),
      })
      if (res.ok) {
        setApiKeyValid(true)
        return true
      }
      const data = await res.json().catch(() => ({}))
      setApiKeyValid(false)
      setApiKeyError(data.error ?? 'Invalid API key')
      return false
    } catch {
      setApiKeyValid(false)
      setApiKeyError('Could not reach validation endpoint')
      return false
    } finally {
      setValidating(false)
    }
  }

  function handleOAuth() {
    if (!apiKey.trim()) { setApiKeyError('Required before connecting Figma'); return }
    setAiCredentials(provider.id, apiKey.trim(), model)
    window.location.href = '/api/auth/signin/figma'
  }

  async function handleContinuePAT() {
    let hasError = false
    if (!apiKey.trim()) { setApiKeyError('Required'); hasError = true }
    if (!pat.trim()) { setPatError('Required'); hasError = true }
    if (hasError) return

    const valid = await validateKey(apiKey.trim())
    if (!valid) return

    setAiCredentials(provider.id, apiKey.trim(), model)
    setFigmaToken(pat.trim(), 'pat')
    setStepStatus(1, 'done')
    setCurrentStep(2)
    router.push('/wizard/2')
  }

  const keyStatus = apiKeyValid === true ? 'valid' : apiKeyValid === false ? 'invalid' : 'idle'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connect your tools</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose your AI engine and connect Figma to get started.
        </p>
      </div>

      {/* ── 1. AI Engine ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
          <span className="text-sm font-medium">AI engine</span>
        </div>

        {/* Provider picker */}
        <div className="relative">
          <select
            value={provider.id}
            onChange={(e) => {
              const p = PROVIDERS.find((x) => x.id === e.target.value)
              if (p) selectProvider(p)
            }}
            className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-2.5 pr-10 text-[13px] font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.logo}  {p.name}{!p.mcp ? '  (No Figma MCP)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {!provider.mcp && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 leading-snug">
              <strong>{provider.name}</strong> does not support Figma MCP live integration.
              Skills that read Figma directly will be unavailable.
              Switch to <button onClick={() => selectProvider(PROVIDERS[0])} className="underline font-medium">Anthropic</button> for full functionality.
            </p>
          </div>
        )}

        {/* Key input */}
        <div className={cn(
          'rounded-2xl border bg-card p-4 space-y-3 transition-colors',
          apiKeyError ? 'border-destructive/40' : 'border-border'
        )}>
          <div className="flex items-start justify-between gap-2">
            <Label className="text-[13px]">
              {provider.name} API key
            </Label>
            <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0">
              Get key <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setApiKeyValid(null); setApiKeyError('') }}
              onBlur={() => apiKey.trim() && validateKey(apiKey.trim())}
              placeholder={provider.placeholder}
              className={cn('pr-20 font-mono text-[13px] h-10', apiKeyError ? 'border-destructive' : '')}
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {validating && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
              {!validating && keyStatus === 'valid' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              {!validating && keyStatus === 'invalid' && <AlertCircle className="w-3.5 h-3.5 text-destructive" />}
              <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors">
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {apiKeyError && (
            <p className="text-[12px] text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 shrink-0" />{apiKeyError}
            </p>
          )}
        </div>

        {/* Model selector */}
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">Model</Label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-card px-3 pr-9 text-[13px] text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {provider.models.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── 2. Figma ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
          <span className="text-sm font-medium">Figma access</span>
        </div>

        {oauthAvailable && (
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted">
            {(['oauth', 'pat'] as const).map((mode) => (
              <button key={mode} onClick={() => setFigmaMode(mode)}
                className={cn(
                  'py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                  figmaMode === mode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}>
                {mode === 'oauth' ? 'OAuth (recommended)' : 'Personal token'}
              </button>
            ))}
          </div>
        )}

        {figmaMode === 'oauth' && oauthAvailable ? (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#9747FF]/10 border border-[#9747FF]/20 flex items-center justify-center shrink-0">
                <Figma className="w-4 h-4 text-[#9747FF]" />
              </div>
              <div>
                <p className="text-[13px] font-medium">Log in with Figma</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Secure OAuth — no password is shared</p>
              </div>
            </div>
            <Button onClick={handleOAuth} className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
              <Figma className="w-4 h-4 mr-2" /> Continue with Figma
            </Button>
          </div>
        ) : (
          <div className={cn('rounded-2xl border bg-card p-4 space-y-3', patError ? 'border-destructive/40' : 'border-border')}>
            {oauthAvailable === false && (
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-snug">
                  OAuth not configured — set <code className="font-mono">FIGMA_CLIENT_ID</code>, <code className="font-mono">FIGMA_CLIENT_SECRET</code> and <code className="font-mono">NEXTAUTH_SECRET</code> in <code className="font-mono">wizard/.env.local</code> to enable it.
                </p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                <Key className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[13px] font-medium">Personal Access Token</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Figma → Settings → Security → Personal access tokens</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Input
                type="password"
                value={pat}
                onChange={(e) => { setPat(e.target.value); setPatError('') }}
                placeholder="figd_..."
                className={cn('font-mono text-[13px] h-10', patError ? 'border-destructive' : '')}
              />
              {patError && (
                <p className="text-[12px] text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0" />{patError}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">Stored only in your browser session.</p>
            </div>
            <Button onClick={handleContinuePAT} disabled={validating} className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
              {validating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue →
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
