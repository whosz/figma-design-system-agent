'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Cloud, Monitor, Globe, Code2 } from 'lucide-react'

type Tab = 'remote' | 'local' | 'rest'

interface FigmaConnectionModalProps {
  open: boolean
  onClose: () => void
  onSelectRest?: () => void
}

export function FigmaConnectionModal({ open, onClose, onSelectRest }: FigmaConnectionModalProps) {
  const [tab, setTab] = useState<Tab>('remote')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Figma connection options</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {([
            { id: 'remote', label: 'Remote MCP', icon: Cloud },
            { id: 'local',  label: 'Local MCP',  icon: Monitor },
            { id: 'rest',   label: 'REST API',   icon: Code2 },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                tab === id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-3 text-[13px] text-muted-foreground">
          {tab === 'remote' && (
            <>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#9747FF] shrink-0" />
                <span className="font-medium text-foreground">Remote MCP (default)</span>
                <span className="ml-auto text-[11px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">OAuth token required</span>
              </div>
              <p>Connects to <code className="text-[12px]">mcp.figma.com</code> using a Figma OAuth token. The wizard handles authentication automatically.</p>
              <p className="font-medium text-foreground text-[12px]">Best for:</p>
              <ul className="list-disc list-inside space-y-1 text-[12px]">
                <li>Full skill support (including readiness check, screenshots)</li>
                <li>CI/CD or environments without Figma desktop</li>
                <li>Anthropic AI provider (required for MCP)</li>
              </ul>
              <p className="text-[12px]">Note: may require a paid Figma plan for some accounts.</p>
            </>
          )}

          {tab === 'local' && (
            <>
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-medium text-foreground">Local MCP (free)</span>
                <span className="ml-auto text-[11px] rounded-full bg-green-100 text-green-700 px-2 py-0.5">Free</span>
              </div>
              <p>Uses the Figma desktop app's built-in Dev Mode MCP server running on <code className="text-[12px]">localhost:3845</code>. No OAuth token needed.</p>
              <p className="font-medium text-foreground text-[12px]">Setup (one-time):</p>
              <ol className="list-decimal list-inside space-y-1 text-[12px]">
                <li>Install Figma desktop app (<code>figma.com/downloads</code>)</li>
                <li>Open Figma → Preferences → Enable Dev Mode MCP Server</li>
                <li>Add to <code>wizard/.env.local</code>:
                  <pre className="mt-1 rounded bg-muted px-2 py-1 text-[11px] font-mono">FIGMA_MCP_URL=http://127.0.0.1:3845/mcp</pre>
                </li>
                <li>Restart the wizard server</li>
              </ol>
              <p className="text-[12px]">Requires Anthropic AI provider (MCP is Anthropic-only).</p>
            </>
          )}

          {tab === 'rest' && (
            <>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-medium text-foreground">REST API (free)</span>
                <span className="ml-auto text-[11px] rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">Free · Read-only</span>
              </div>
              <p>Fetches design data from the Figma REST API using your Personal Access Token. No MCP server required — works with any AI provider.</p>
              <p className="font-medium text-foreground text-[12px]">Works automatically when:</p>
              <ul className="list-disc list-inside space-y-1 text-[12px]">
                <li>You select a non-Anthropic AI provider (OpenAI, Gemini, Copilot)</li>
                <li>You toggle "Use REST API" below</li>
              </ul>
              <p className="font-medium text-foreground text-[12px]">Limitations vs MCP:</p>
              <ul className="list-disc list-inside space-y-1 text-[12px]">
                <li>Read-only — <code>code-to-figma</code> and <code>code-connect-sync</code> unavailable</li>
                <li>No live screenshots</li>
                <li>Slightly reduced accuracy on readiness check</li>
              </ul>
              {onSelectRest && (
                <button
                  onClick={() => { onSelectRest(); onClose() }}
                  className="mt-1 w-full rounded-xl border border-blue-200 bg-blue-50 py-2 text-[13px] font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Use REST API for this session
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
