import Link from 'next/link'
import { ArrowRight, Layers, Component, Wand2, Download, ShieldCheck, Zap, Figma } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-[#9747FF]/30">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none">🧙‍♂️</span>
            <span className="font-semibold text-[14px] tracking-tight text-white">DS Wizard</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#skills" className="hover:text-white transition-colors">Skills</a>
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
          </nav>
          <Link href="/wizard/1" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-8 px-4 text-[13px] bg-white text-black hover:bg-white/90 font-medium">
              Start building
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Purple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#9747FF]/12 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium text-white/60 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9747FF] animate-pulse" />
            Powered by Claude + Figma MCP
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-white mb-6">
            Your Figma design system,<br />
            <span className="text-[#9747FF]">turned into code.</span>
          </h1>

          <p className="text-[17px] text-white/50 leading-relaxed max-w-2xl mx-auto mb-10">
            A guided 7-step wizard that extracts tokens and generates production-ready components
            directly from your Figma file — no manual work required.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/wizard/1" target="_blank" rel="noopener noreferrer">
              <Button className="h-11 px-6 text-[14px] bg-[#9747FF] hover:bg-[#8035f0] text-white font-medium gap-2">
                Start for free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="h-11 px-6 text-[14px] border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white">
                View on GitHub
              </Button>
            </a>
          </div>

          <p className="mt-5 text-[12px] text-white/25">
            Bring your own Anthropic API key · No account required
          </p>
        </div>

        {/* Steps preview strip */}
        <div className="max-w-5xl mx-auto px-6 pb-16 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max mx-auto w-fit">
            {['Connect', 'Verify', 'Profile', 'Extract', 'Validate', 'Generate', 'Export'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold border transition-all
                    ${i === 0 ? 'bg-[#9747FF] border-[#9747FF] text-white' : 'border-white/15 text-white/30 bg-white/5'}`}>
                    {i + 1}
                  </div>
                  <span className="text-[11px] text-white/30 whitespace-nowrap">{label}</span>
                </div>
                {i < 6 && <div className="w-12 h-px bg-white/10 mx-1 mb-5" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Everything you need</h2>
            <p className="text-[15px] text-white/40 max-w-xl mx-auto">
              From Figma file to deployable design system — one workflow, no configuration files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200">
                <div className="w-9 h-9 rounded-xl bg-[#9747FF]/15 border border-[#9747FF]/20 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-[#9747FF]" />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">21 built-in skills</h2>
            <p className="text-[15px] text-white/40 max-w-xl mx-auto">
              Each skill is a focused AI instruction set. The wizard chains them automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKILLS.map(({ name, label, desc }) => (
              <div key={name}
                className="flex items-start gap-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9747FF] mt-[7px] shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-white">{label}</p>
                  <p className="text-[12px] text-white/40 mt-0.5">{desc}</p>
                  <code className="text-[10px] text-[#9747FF]/60 mt-1 block">{name}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
          <p className="text-[15px] text-white/40 mb-14 max-w-xl mx-auto">
            Three things you need. One workflow that does the rest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              { num: '01', title: 'Your Figma file', body: 'A file with a dedicated library page for variables and components.' },
              { num: '02', title: 'Anthropic API key', body: 'The wizard uses your own key — usage is billed to your account.' },
              { num: '03', title: 'Click Start', body: 'The wizard guides you through every step with real-time AI output.' },
            ].map(({ num, title, body }) => (
              <div key={num} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-left">
                <span className="text-[11px] font-bold text-[#9747FF] tracking-widest uppercase">{num}</span>
                <h3 className="text-[15px] font-semibold text-white mt-3 mb-2">{title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <Link href="/wizard/1" target="_blank" rel="noopener noreferrer">
            <Button className="h-12 px-8 text-[15px] bg-[#9747FF] hover:bg-[#8035f0] text-white font-medium gap-2">
              Start building your design system <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <p className="mt-4 text-[12px] text-white/20">Free · Open source · Self-hosted</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-[12px] text-white/25">
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
