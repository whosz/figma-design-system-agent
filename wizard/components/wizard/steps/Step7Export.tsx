'use client'

import { useState } from 'react'
import { useWizardStore } from '@/lib/wizard-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Download, Globe, FileText, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExportState = 'idle' | 'running' | 'done' | 'error'

export function Step7Export() {
  const { showcaseHtml, tokenOverrides, componentEntries } = useWizardStore()
  const [zipState, setZipState] = useState<ExportState>('idle')
  const [pagesState, setPagesState] = useState<ExportState>('idle')
  const [aiState, setAiState] = useState<ExportState>('idle')
  const [pagesUrl, setPagesUrl] = useState('')
  const [pagesRepo, setPagesRepo] = useState('')
  const [pagesToken, setPagesToken] = useState('')
  const [aiFormat, setAiFormat] = useState<'designrules' | 'claude' | 'copilot'>('designrules')
  const [showPagesForm, setShowPagesForm] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiContent, setAiContent] = useState('')

  async function downloadZip() {
    setZipState('running')
    const res = await fetch('/api/export/zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showcaseHtml, tokenOverrides, components: componentEntries }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'design-system.zip' }).click()
    URL.revokeObjectURL(url)
    setZipState('done')
  }

  async function deployToPages() {
    if (!pagesRepo || !pagesToken) return
    setPagesState('running')
    const res = await fetch('/api/export/github-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName: pagesRepo, githubToken: pagesToken, showcaseHtml }),
    })
    const data = await res.json()
    if (data.url) { setPagesUrl(data.url); setPagesState('done') }
    else { setPagesState('error') }
  }

  async function exportAiInstructions() {
    setAiState('running')
    const res = await fetch('/api/export/ai-instructions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: aiFormat, tokenOverrides, components: componentEntries }),
    })
    const text = await res.text()
    setAiContent(text)
    setAiState('done')
    setShowAiModal(true)
  }

  function downloadAiFile() {
    const names = { designrules: '.designrules.md', claude: 'CLAUDE.md', copilot: 'copilot-instructions.md' }
    const blob = new Blob([aiContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: names[aiFormat] }).click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Export</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Your design system is ready. Choose how to export it.
        </p>
      </div>

      {showcaseHtml && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="bg-muted px-4 py-2.5 border-b border-border flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
            </div>
            <span className="text-[11px] text-muted-foreground ml-1">showcase/components.html</span>
          </div>
          <iframe srcDoc={showcaseHtml} className="w-full h-56" title="Showcase preview" />
        </div>
      )}

      <div className="space-y-3">
        {/* ZIP */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold">Download ZIP</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Tokens + components + showcase page</p>
            </div>
            <Button onClick={downloadZip} disabled={zipState === 'running'} size="sm" variant="outline"
              className={cn('h-8 text-[12px]', zipState === 'done' && 'text-green-600 border-green-200')}>
              {zipState === 'running' && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              {zipState === 'done' && <CheckCircle2 className="w-3 h-3 mr-1.5" />}
              {zipState === 'idle' ? 'Download' : zipState === 'running' ? 'Packing...' : 'Done'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* GitHub Pages */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold">Deploy to GitHub Pages</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Get a public URL for the showcase</p>
            </div>
            <Button onClick={() => setShowPagesForm(!showPagesForm)} size="sm" variant="outline" className="h-8 text-[12px]">
              {showPagesForm ? 'Cancel' : 'Set up'}
            </Button>
          </div>

          {showPagesForm && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-[12px]">Repository name</Label>
                <Input value={pagesRepo} onChange={(e) => setPagesRepo(e.target.value)}
                  placeholder="my-design-system" className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">GitHub Personal Access Token</Label>
                <Input type="password" value={pagesToken} onChange={(e) => setPagesToken(e.target.value)}
                  placeholder="ghp_..." className="h-9 text-[13px] font-mono" />
              </div>
              <Button onClick={deployToPages} disabled={pagesState === 'running' || !pagesRepo || !pagesToken}
                className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-white text-[13px]">
                {pagesState === 'running' && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                {pagesState === 'running' ? 'Deploying...' : 'Deploy'}
              </Button>
              {pagesUrl && (
                <a href={pagesUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-[12px] text-primary hover:underline">
                  {pagesUrl} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* AI instructions */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold">Export AI instructions</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Design rules file for Cursor, Claude Code, or Copilot
              </p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {(['designrules', 'claude', 'copilot'] as const).map((f) => (
              <button key={f} onClick={() => setAiFormat(f)}
                className={cn(
                  'flex-1 rounded-lg border py-2 text-[11px] font-medium transition-all',
                  aiFormat === f ? 'border-primary bg-accent text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                )}>
                {f === 'designrules' ? '.designrules' : f === 'claude' ? 'CLAUDE.md' : 'Copilot'}
              </button>
            ))}
          </div>

          <Button onClick={exportAiInstructions} disabled={aiState === 'running'}
            className="w-full h-9 bg-[#9747FF] hover:bg-[#8035f0] text-white text-[13px]">
            {aiState === 'running' && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            {aiState === 'running' ? 'Generating...' : 'Generate file'}
          </Button>
        </div>
      </div>

      {/* AI Instructions Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="font-semibold text-[14px]">Preview</p>
              <button onClick={() => setShowAiModal(false)} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                ✕
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-5 text-[12px] font-mono text-gray-700 bg-gray-50">
              {aiContent}
            </pre>
            <div className="px-5 py-4 border-t border-border">
              <Button onClick={downloadAiFile}
                className="w-full h-10 bg-[#9747FF] hover:bg-[#8035f0] text-white">
                Download file
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
