---
name: docs-and-metrics
description: >
  Generate and maintain project documentation (design system docs, component
  pages with all states, prototype docs, changelog) and produce work metrics:
  design-token usage statistics, LLM token consumption, and time spent per
  task/artifact. Use when the user asks to "document this", "update the
  docs", "how many tokens did we use", "how long did this take", wants a
  summary report for stakeholders, or at the end of a milestone. Also
  defines the work-log convention every other skill appends to.
---

# Docs & Metrics

Two jobs in one skill because they share a data source: it turns the agent's
artifacts into human-readable documentation, and turns the agent's activity
into numbers — token usage and time spent.

## Part 1 — Documentation generation

Generated into `design-system/docs/` and `prototypes/<name>/docs/`, always
**regenerable from artifacts** (the manifests, token files, flow JSONs and
reports are the source of truth — docs are a view, never hand-edited
canon; put a "generated, do not edit" header in each file).

- **Token reference** (`tokens.md`): every token with value, Figma variable
  it maps to, modes (light/dark), and live usage count (from Part 2 stats).
  Rendered swatches/scales where the format allows.
- **Component pages** (`components/<name>.md`): purpose, import/usage
  snippet per the target profile, props/variants table, and a **state
  gallery covering every state** (default, hover, focus, pressed, disabled,
  error, loading…) — consistent with the project rule that all states are
  first-class. Include each state's screenshot when a headless browser is
  available. Code Connect status noted when `code-connect-sync` has run.
- **Prototype docs**: screens × breakpoints, flow diagram (reuse the
  Mermaid output from `extract-app-flows`), DS gap list, assumptions
  carried over from `docs-to-prototype` briefs.
- **Changelog** (`CHANGELOG.md`): appended per session from the work log —
  what was created/changed, by which skill, against which Figma version.
- **Stakeholder summary** (on request): one-pager in plain language — what
  exists, what's validated, what's pending — suitable for non-technical
  readers.

## Part 2 — Metrics

### The work log (convention all skills follow)

Every skill appends one JSON line per task to `reports/work-log.jsonl`:

```json
{"ts_start":"2026-06-11T09:14:02Z","ts_end":"2026-06-11T09:21:40Z",
 "skill":"generate-component","task":"Button (all states)",
 "artifacts":["design-system/components/button/"],
 "figma_source":"file abc, node 1:23",
 "llm_tokens":{"value":48200,"basis":"client-reported"},
 "result":"ok"}
```

This convention belongs in AGENTS.md as a global rule — without it, this
skill can only measure the present session.

### Design-token usage statistics

Scan `design-system/components/` and `prototypes/` for token references:

- usage count per token (top/bottom lists; **unused tokens** are prime
  candidates for designer review)
- hardcoded-value violations (raw values where a token exists — cross-link
  each to a `design-fidelity-audit` finding when one exists)
- coverage ratio per artifact: % of visual properties bound to tokens

### LLM token consumption — with honest accounting

Exact counts are owned by the platform, not the conversation, so every
figure carries a `basis` label and the report never mixes bases silently:

- `client-reported` — when the running client exposes usage (e.g. usage
  panels/logs in Copilot or Claude Code), record the real number
- `estimated` — otherwise estimate from artifact sizes and conversation
  length using a stated chars-per-token heuristic, and label it as such
- The report always points to the platform's own billing/usage page as the
  authoritative source. Never present an estimate as a measurement.

### Time spent

- Per task: `ts_end − ts_start` from the work log (wall-clock of the
  agent's work, including tool calls)
- Aggregations: per skill, per artifact, per day/milestone
- Caveat stated in every report: this measures *agent working time*; human
  review/decision time between sessions is not captured unless the user
  logs it (`/metrics log-review 30m` appends a manual entry)

### The metrics report

`reports/metrics-<period>.md`, also summarized in chat:

```
# Metrics — 2026-06-01 → 2026-06-11

Artifacts: 14 components, 3 prototypes (9 screens), 1 flow app
Agent time: 6h 12m  (top: build-rwd-prototype 2h 40m)
LLM tokens: 1.34M client-reported + 0.21M estimated
Token coverage: 96.4% (11 hardcoded-value violations, ↓ from 25)
Unused design tokens: 7 (list…)
```

## Hard rules

1. Docs are generated views — regenerable, marked as generated, never the
   place where truth is edited.
2. Component documentation without the full state gallery is incomplete —
   fail the doc build for interactive components missing state entries and
   point to `validate-extraction`'s state matrix.
3. Every metric carries its basis (`client-reported` / `estimated` /
   `manual`); estimates are labeled in the same line as the number.
4. The work log is append-only; corrections are new entries with
   `"supersedes"` references, not edits.
5. Metrics describe the work, not the people — no framing of timing data as
   individual performance measurement.

## Example invocations

- "Generate the design system documentation"
- "/metrics report last-7-days"
- "How much time and how many tokens did the checkout prototype take?"
- "Prepare a stakeholder summary of what the agent built this sprint"
