'use client'

import { useState, useEffect } from 'react'
import { Download, Layers, Component, ShieldCheck, Zap, Figma, Sun, Moon, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SKILLS = [
  { name: 'figma-readiness-check',  label: 'Readiness Check',       desc: 'Verifies your Figma file structure before extraction.' },
  { name: 'extract-design-system',  label: 'Token Extraction',       desc: 'Pulls colors, typography, spacing and effects.' },
  { name: 'validate-extraction',    label: 'Extraction Validation',  desc: 'Cross-checks tokens against live Figma data.' },
  { name: 'generate-component',     label: 'Component Generation',   desc: 'Generates all states and variants as production code.' },
  { name: 'showcase-pages',         label: 'Showcase Page',          desc: 'Single-page gallery of every component.' },
  { name: 'export-ide-context',     label: 'IDE Context Export',     desc: 'Creates .designrules.md for Cursor, Claude Code & Copilot.' },
  { name: 'detect-icon-library',    label: 'Icon Library Detection', desc: 'Finds the icon set used in your design system.' },
  { name: 'figma-version-diff',     label: 'Version Diff',          desc: 'Detects breaking changes between Figma versions.' },
]

const FEATURES = [
  {
    icon: Figma,
    title: 'Figma-native',
    body: 'Connects directly to your Figma file via OAuth or a Personal Access Token. No plugins, no manual export.',
  },
  {
    icon: Zap,
    title: 'AI-powered extraction',
    body: 'Claude reads your design system and generates accurate, typed token files — CSS, SCSS, TypeScript, Tailwind.',
  },
  {
    icon: Layers,
    title: '21 built-in skills',
    body: 'From readiness check to version diff, each skill is a focused instruction set that runs as a streaming AI call.',
  },
  {
    icon: Component,
    title: 'Component gallery',
    body: 'Generates a single showcase HTML page with all components, states and variants — ready to share instantly.',
  },
  {
    icon: ShieldCheck,
    title: 'Validated output',
    body: 'Every extraction is cross-checked against live Figma before code generation begins.',
  },
  {
    icon: Download,
    title: 'One-click export',
    body: 'Download a ZIP, deploy to GitHub Pages, or export AI instruction files for your IDE — in one step.',
  },
]

/* ── Theme tokens ── */
const BLUE = '#9747FF'
const BLUE_HOVER = '#8035f0'

function useTheme() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ds-wizard-theme')
    if (stored) setDark(stored === 'dark')
  }, [])

  function toggle() {
    setDark((d) => {
      localStorage.setItem('ds-wizard-theme', d ? 'light' : 'dark')
      return !d
    })
  }

  return { dark, toggle }
}

export default function Home() {
  const { dark, toggle } = useTheme()

  const bg       = dark ? '#0a0a0b'  : '#f8fafc'
  const surface  = dark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const border   = dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'
  const text      = dark ? '#ffffff'  : '#0f172a'
  const muted    = dark ? 'rgba(255,255,255,0.45)' : '#64748b'
  const navBg    = dark ? 'rgba(10,10,11,0.80)' : 'rgba(248,250,252,0.85)'
  const cardHover = dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
  const mutedBg  = dark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'
  const mutedBorder = dark ? 'rgba(255,255,255,0.10)' : '#e2e8f0'
  const skillBg  = dark ? 'rgba(255,255,255,0.02)' : '#ffffff'
  const codeMuted = dark ? 'rgba(37,99,235,0.55)' : '#2563EB'

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text }} className="selection:bg-blue-500/20 transition-colors duration-300">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ borderBottom: `1px solid ${border}`, background: navBg }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none">🧙‍♂️</span>
            <span className="font-semibold text-[14px] tracking-tight" style={{ color: text }}>DS Wizard</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px]" style={{ color: muted }}>
            <a href="#features" className="hover:opacity-100 transition-opacity" style={{ color: muted }}>Features</a>
            <a href="#skills" className="hover:opacity-100 transition-opacity" style={{ color: muted }}>Skills</a>
            <a href="https://github.com/whosz/figma-design-system-agent" target="_blank" rel="noopener noreferrer" style={{ color: muted }}>GitHub</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: muted, background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = mutedBg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href="https://github.com/whosz/figma-design-system-agent/releases/latest" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="h-8 px-4 text-[13px] font-medium gap-1.5" style={{ background: dark ? '#ffffff' : text, color: dark ? '#000000' : '#ffffff' }}>
                <Download className="w-3 h-3" /> Download
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full pointer-events-none blur-[120px]"
          style={{ background: `${BLUE}1a` }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-medium mb-8"
            style={{ border: `1px solid ${mutedBorder}`, background: mutedBg, color: muted }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BLUE }} />
            Powered by Claude + Figma MCP
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-6" style={{ color: text }}>
            Your Figma design system,<br />
            <span style={{ color: BLUE }}>turned into code.</span>
          </h1>

          <p className="text-[17px] leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: muted }}>
            A guided 7-step wizard that extracts tokens and generates production-ready components
            directly from your Figma file — no manual work required.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="https://github.com/whosz/figma-design-system-agent/releases/latest" target="_blank" rel="noopener noreferrer">
              <Button className="h-11 px-6 text-[14px] text-white font-medium gap-2" style={{ background: BLUE }}>
                <Download className="w-4 h-4" /> Download latest release
              </Button>
            </a>
            <a href="https://github.com/whosz/figma-design-system-agent" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-11 px-6 text-[14px] font-medium"
                style={{ borderColor: mutedBorder, background: mutedBg, color: text }}>
                View on GitHub
              </Button>
            </a>
          </div>

          <p className="mt-5 text-[12px]" style={{ color: dark ? 'rgba(255,255,255,0.25)' : '#94a3b8' }}>
            Self-hosted · Open source · MIT License
          </p>
        </div>

        {/* Steps strip */}
        <div className="max-w-5xl mx-auto px-6 pb-16 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max mx-auto w-fit">
            {['Connect', 'Verify', 'Profile', 'Extract', 'Validate', 'Generate', 'Export'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
                    style={{
                      background: i === 0 ? BLUE : mutedBg,
                      border: `1px solid ${i === 0 ? BLUE : mutedBorder}`,
                      color: i === 0 ? '#ffffff' : muted,
                    }}>
                    {i + 1}
                  </div>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: muted }}>{label}</span>
                </div>
                {i < 6 && <div className="w-12 h-px mx-1 mb-5" style={{ background: mutedBorder }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24" style={{ borderTop: `1px solid ${border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: text }}>Everything you need</h2>
            <p className="text-[15px] max-w-xl mx-auto" style={{ color: muted }}>
              From Figma file to deployable design system — one workflow, no configuration files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}
                className="rounded-2xl p-6 transition-all duration-200 cursor-default"
                style={{ border: `1px solid ${border}`, background: surface }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = cardHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = surface }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${BLUE}1a`, border: `1px solid ${BLUE}33` }}>
                  <Icon className="w-4 h-4" style={{ color: BLUE }} />
                </div>
                <h3 className="text-[14px] font-semibold mb-2" style={{ color: text }}>{title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: muted }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="py-24" style={{ borderTop: `1px solid ${border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: text }}>21 built-in skills</h2>
            <p className="text-[15px] max-w-xl mx-auto" style={{ color: muted }}>
              Each skill is a focused AI instruction set. The wizard chains them automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKILLS.map(({ name, label, desc }) => (
              <div key={name}
                className="flex items-start gap-4 rounded-xl px-5 py-4 transition-colors"
                style={{ border: `1px solid ${border}`, background: skillBg }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = cardHover }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = skillBg }}>
                <div className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ background: BLUE }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: text }}>{label}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: muted }}>{desc}</p>
                  <code className="text-[10px] mt-1 block" style={{ color: codeMuted }}>{name}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24" style={{ borderTop: `1px solid ${border}` }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ color: text }}>How it works</h2>
          <p className="text-[15px] mb-14 max-w-xl mx-auto" style={{ color: muted }}>
            Three things you need. One workflow that does the rest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              { num: '01', title: 'Your Figma file', body: 'A file with a dedicated library page for variables and components.' },
              { num: '02', title: 'AI API key', body: 'Bring your own key — Anthropic, OpenAI, Gemini, or GitHub Copilot.' },
              { num: '03', title: 'Run the wizard', body: 'Download, run start-wizard, and follow the 7-step guided flow.' },
            ].map(({ num, title, body }) => (
              <div key={num} className="rounded-2xl p-6 text-left"
                style={{ border: `1px solid ${border}`, background: surface }}>
                <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: BLUE }}>{num}</span>
                <h3 className="text-[15px] font-semibold mt-3 mb-2" style={{ color: text }}>{title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: muted }}>{body}</p>
              </div>
            ))}
          </div>

          <a href="https://github.com/whosz/figma-design-system-agent/releases/latest" target="_blank" rel="noopener noreferrer">
            <Button className="h-12 px-8 text-[15px] text-white font-medium gap-2" style={{ background: BLUE }}>
              <Download className="w-4 h-4" /> Download & run locally
            </Button>
          </a>
          <p className="mt-4 text-[12px]" style={{ color: dark ? 'rgba(255,255,255,0.20)' : '#94a3b8' }}>Free · Open source · Self-hosted</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8" style={{ borderTop: `1px solid ${border}` }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-[12px]" style={{ color: muted }}>
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🧙‍♂️</span>
            <span>figma-design-system-agent</span>
          </div>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
