# Figma Design System Agent

**v0.2.1** — an AI agent toolkit that turns Figma into working design systems
and responsive prototypes, and back again. Works in GitHub Copilot
(VS Code & cloud), Claude Code, Cursor, Windsurf, Cline, and any
MCP-capable AI client.

## What it does

- **Figma → code**: extracts design tokens and components (all interaction
  states included) into a versioned design system; builds responsive
  prototypes from designs; reads prototype flows to wire up complete
  clickable apps.
- **Code → Figma**: generates Figma designs, components and variables from
  existing prototypes or an adopted component library.
- **Docs → prototype**: builds prototypes straight from workshop notes,
  Miro boards or SharePoint/Confluence documentation when no design exists
  yet.
- **Quality & delivery**: validates extractions, audits fidelity against
  designs, links components via Code Connect, publishes serverless
  `file://` bundles or online deploys, and generates galleries, docs and
  effort metrics.

Everything the agent knows about *how* to do this lives in two places you
can read: [`AGENTS.md`](AGENTS.md) (global rules + skill dependency graph)
and [`skills/`](skills/) (one instruction file per capability).

## Requirements

- A Figma account with access to your design files
  - **Local mode**: Figma desktop app with the Dev Mode MCP server enabled
    (Figma → Preferences → Enable local MCP server)
  - **Remote mode**: OAuth access to `https://mcp.figma.com/mcp`
- An MCP-capable AI client: VS Code with GitHub Copilot, Claude Code, or
  similar
- Node.js ≥ 20 (only for `framework-app` output tier and online deploys)

## Installation

1. **Use this template** → create your repository from it on GitHub.
2. **Connect the Figma MCP server** — config files are pre-wired:
   - VS Code / Copilot: `.vscode/mcp.json`
   - Claude Code: `.mcp.json`
   - Cursor: `.cursor/rules/figma-agent.mdc` (rules auto-applied)
   - Windsurf: `.windsurfrules`
   - Cline: `.clinerules`
   Pick local or remote MCP mode by uncommenting the matching entry, then
   restart/reload your client.
3. **Verify**: ask the agent to *"test the MCP connections"*
   (`mcp-doctor`). You want a green status table before anything else.

## Quickstart — first design system in 6 steps

Talk to the agent in your client's chat. Skills trigger from natural
language; slash-prompts are listed per skill in `skills/*/SKILL.md`.

1. `"Test the MCP connections"` — fail fast if Figma isn't reachable.
2. `"Set up the target profile"` — one short Q&A: what code to generate
   (default: HTML+CSS that opens from a file), CSS approach (plain CSS,
   Tailwind, SCSS, …), and which devices to target. Saved to
   `design-system/target-profile.json`.
3. *(optional)* `"We already have components in <path> — use them"` —
   adopts your existing library as the default instead of generating one.
4. `"Check if our Figma file is ready: <link>"` — readiness report with a
   designer-friendly fix list; detects dedicated component/variable pages.
5. `"Extract the design system from <link>"` — the agent asks if you want
   an auto-maintained component gallery, detects the icon library, pulls
   tokens (CSS + SCSS + TypeScript + Tailwind config) and the full component
   inventory including descriptions and documentation from Figma.
   Then `"Validate the extraction"`.
6. `"Build a responsive prototype of <screen>"` → `"Audit it against the
   design"` → `"Package it so the client can open it without a server"`.

To check what changed in Figma since last extraction: `"What changed in
Figma since last time?"` — runs `figma-version-diff` and tells you exactly
what to re-extract before regenerating.

## Skill catalog

| Skill | What it does | Status |
|---|---|---|
| `mcp-doctor` | diagnose & smoke-test MCP connections | ✅ |
| `target-profile-setup` | choose output tech + target devices, persist as profile | ✅ |
| `adopt-component-repo` | use an existing code library as the default DS | ✅ |
| `figma-readiness-check` | audit Figma file quality; detect dedicated component/variable pages | ✅ |
| `detect-icon-library` | find icon library in Figma or code; ask for link if not found | ✅ |
| `design-system-search` | natural-language queries over extracted tokens & components | ✅ |
| `figma-version-diff` | diff live Figma vs. last extraction; changelog before re-run | ✅ |
| `extract-design-system` | tokens → CSS/SCSS/TS/Tailwind + component inventory + descriptions | ✅ |
| `extract-app-flows` | read prototype flows / FigJam → flow graph → wired app | ✅ |
| `knowledge-ingest` | ingest SharePoint / Confluence / Drive / Miro docs | ✅ |
| `validate-extraction` | verify extracted data vs. live Figma, incl. all states | ✅ |
| `ds-naming-audit` | detect naming mismatches Figma ↔ code; typos, aliases, conventions | ✅ |
| `ds-gap-analysis` | 3-bucket coverage: Figma-only (implement), Code-only (document), Both (verify) | ✅ |
| `ds-checklist` | generate & manage prioritised DS alignment task list by category | ✅ |
| `generate-component` | Figma component → code component, all states; auto-updates gallery | ✅ |
| `build-rwd-prototype` | compose responsive prototypes from components | ✅ |
| `docs-to-prototype` | prototypes from notes/boards when no design exists | ✅ |
| `code-to-figma` | push prototypes/components back into Figma | ✅ |
| `design-fidelity-audit` | implementation vs. design, severity-graded report | ✅ |
| `code-connect-sync` | map Figma components ↔ code (on demand) | ✅ |
| `publish-prototype` | serverless `file://` bundle + optional online deploy | ✅ |
| `showcase-pages` | single-page component gallery + project summary page | ✅ |
| `docs-and-metrics` | docs, token usage stats, time & token metrics | ✅ |
| `export-ide-context` | design system → `.designrules.md` for Cursor/Windsurf @file | ✅ |

## The guarantees (short version of AGENTS.md)

- Every visual value binds to a design token — no magic numbers.
- Every interaction state (hover, focus, pressed, disabled, …) is extracted,
  generated, validated, documented and showcased — not just defaults.
- Existing component libraries are reused, never recreated or restyled.
- Writes to Figma are additive only (`[generated]` frames); nothing of
  yours gets modified or deleted.
- Anything public-facing (deploys, Code Connect publishing) happens only
  after you explicitly confirm in chat.
- Reports distinguish measurements from estimates and facts from
  assumptions — always.
- WCAG 2.2 AA accessibility floor on all generated code by default.

## Troubleshooting

Start with `mcp-doctor` — it covers the common failures (server not
running, expired auth, proxy blocks, stale tool lists) with per-client
fixes. If extraction quality is poor, run `figma-readiness-check` (messy
source) and `validate-extraction` (broken snapshot) to find out which side
the problem is on.

## Web Wizard

A guided 7-step web UI that runs the agent pipeline without a terminal or
an AI client — just a browser. Designed for designers and developers who
prefer a visual workflow.

**Live page:** [whosz.github.io/figma-design-system-agent](https://whosz.github.io/figma-design-system-agent/)
(landing page only; full wizard functionality requires running locally — see below)

### Steps

1. **Connect** — choose your AI provider (Anthropic, OpenAI, Gemini, or
   GitHub Copilot) and enter your API key; connect Figma via OAuth or PAT
2. **Readiness check** — paste your Figma file URL; the wizard streams a
   full readiness report before continuing
3. **Profile** — pick output tier, CSS approach, and target devices
4. **Extract** — streaming token extraction with live counters
5. **Validate** — cross-checks extraction against live Figma data
6. **Generate** — per-component code generation with streaming output
7. **Export** — download ZIP, deploy to GitHub Pages, or export AI
   instruction files for Cursor / Windsurf / Claude Code

> **Figma connection modes** — four options depending on your setup:
> - **Remote MCP** (default): OAuth token, `mcp.figma.com` — may require a paid Figma plan
> - **Local MCP** (free): Figma desktop app with Dev Mode MCP enabled → set `FIGMA_MCP_URL=http://127.0.0.1:3845/mcp`
> - **Community MCP** (free, read+write): [EXDST](https://github.com/exdst/figma-mcp) local server
> - **REST API** (free, read-only): no MCP needed — works automatically with non-Anthropic providers or via the "Use REST API" toggle in Step 1
>
> Click **Connection options** (?) in Step 1 for setup instructions for each mode.

### Run locally

| Platform | Command |
|---|---|
| macOS / Linux | `./start-wizard.sh` |
| Windows | `start-wizard.bat` |

Run from the repo root or from `wizard/`. On first run the script:
- Creates `wizard/.env.local` from `.env.example` (fill in your keys)
- Installs Node dependencies if missing
- Starts the dev server and **opens `http://localhost:3000/wizard/1`
  automatically** once ready

Requires **Node.js ≥ 20**: `brew install node` (macOS) or
[nodejs.org](https://nodejs.org) (Windows).

### Environment variables (`wizard/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | optional | Server-side fallback; users can bring their own key in Step 1 |
| `FIGMA_MCP_URL` | optional | MCP server URL — defaults to `https://mcp.figma.com/mcp`; set to `http://127.0.0.1:3845/mcp` for local MCP |
| `FIGMA_CLIENT_ID` | for OAuth | From [figma.com/developers/apps](https://www.figma.com/developers/apps) |
| `FIGMA_CLIENT_SECRET` | for OAuth | Same app |
| `NEXTAUTH_SECRET` | for OAuth | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | for OAuth | `http://localhost:3000` (local) or your deploy URL |

PAT (Personal Access Token) mode works without the Figma OAuth variables.
The wizard detects automatically which mode is available and defaults to
PAT with a clear setup note if OAuth is not configured.

REST API mode (no MCP server) activates automatically when a non-Anthropic
provider is selected, or manually via the toggle in Step 1. It fetches
variables, components and styles directly from the Figma REST API — free,
read-only.

## License & contributing

MIT (see `LICENSE`). Issues and PRs welcome — especially additional
knowledge-source connectors and target-profile tiers.
