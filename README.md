# Figma Design System Agent

**v0.1** — an AI agent toolkit that turns Figma into working design systems
and responsive prototypes, and back again. Works in GitHub Copilot
(VS Code & cloud), Claude Code, and any MCP-capable AI client.

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
   Pick local or remote mode by uncommenting the matching entry, then
   restart/reload your client.
3. **Verify**: ask the agent to *"test the MCP connections"*
   (`mcp-doctor`). You want a green status table before anything else.

## Quickstart — first design system in 6 steps

Talk to the agent in your client's chat. Skills trigger from natural
language; slash-prompts are listed per skill in `skills/*/SKILL.md`.

1. `"Test the MCP connections"` — fail fast if Figma isn't reachable.
2. `"Set up the target profile"` — one short Q&A: what code to generate
   (default: HTML+CSS that opens straight from a file) and which devices to
   target. Saved to `design-system/target-profile.json`.
3. *(optional)* `"We already have components in <path> — use them"` —
   adopts your existing library as the default instead of generating one.
4. `"Check if our Figma file is ready: <link>"` — readiness report with a
   designer-friendly fix list.
5. `"Extract the design system from <link>"` then `"Validate the
   extraction"` — tokens + component inventory, verified against live
   Figma including the per-state coverage matrix.
6. `"Build a responsive prototype of <screen>"` → `"Audit it against the
   design"` → `"Package it so the client can open it without a server"`.

Wrap up any milestone with `"Generate the component gallery and project
summary"` — shareable pages built with your own design system.

## Skill catalog

| Skill | What it does | Status |
|---|---|---|
| `mcp-doctor` | diagnose & smoke-test MCP connections | ✅ |
| `target-profile-setup` | choose output tech + target devices, persist as profile | ✅ |
| `adopt-component-repo` | use an existing code library as the default DS | ✅ |
| `figma-readiness-check` | audit Figma file quality before extraction | ✅ |
| `extract-design-system` | Figma variables/components → tokens + inventory | ✅ |
| `extract-app-flows` | read prototype flows / FigJam → flow graph → wired app | ✅ |
| `knowledge-ingest` | ingest SharePoint / Confluence / Drive / Miro docs | ✅ |
| `validate-extraction` | verify extracted data vs. live Figma, incl. all states | ✅ |
| `generate-component` | Figma component → code component, all states | ✅ |
| `build-rwd-prototype` | compose responsive prototypes from components | ✅ |
| `docs-to-prototype` | prototypes from notes/boards when no design exists | ✅ |
| `code-to-figma` | push prototypes/components back into Figma | ✅ |
| `design-fidelity-audit` | implementation vs. design, severity-graded report | ✅ |
| `code-connect-sync` | map Figma components ↔ code (on demand) | ✅ |
| `publish-prototype` | serverless `file://` bundle + optional online deploy | ✅ |
| `showcase-pages` | component gallery page + project summary page | ✅ |
| `docs-and-metrics` | docs, token usage stats, time & token metrics | ✅ |

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

## Troubleshooting

Start with `mcp-doctor` — it covers the common failures (server not
running, expired auth, proxy blocks, stale tool lists) with per-client
fixes. If extraction quality is poor, run `figma-readiness-check` (messy
source) and `validate-extraction` (broken snapshot) to find out which side
the problem is on.

## Roadmap

- **v0.1**: all 17 skills complete, template published
- **v0.2**: skill test suites (eval prompts per skill), example Figma file
  + walkthrough
- **v0.3**: theming/multi-brand token modes, CI workflow running
  validate-extraction + fidelity audits on a schedule

## License & contributing

MIT (see `LICENSE`). Issues and PRs welcome — especially additional
knowledge-source connectors and target-profile tiers.
