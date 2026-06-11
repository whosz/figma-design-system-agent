---
name: figma-readiness-check
description: >
  Audit a Figma file to verify it is properly prepared for design system
  extraction and prototype generation, and report blockers to the user. Use
  this skill before running extract-design-system or build-rwd-prototype for
  the first time on a file, whenever the user asks "is my Figma ready", "check
  my Figma file", "why does extraction give bad results", or when another
  skill produces poor output that suggests messy source designs (raw values
  instead of variables, no auto layout, unnamed layers).
---

# Figma Readiness Check

Audits a Figma file against the requirements of the other skills in this
agent and produces a readiness report. This skill is **read-only**: it never
modifies the Figma file. Its job is to tell the user what to fix and why.

## Inputs

- `target`: Figma file URL (or current selection when using the local Dev
  Mode MCP server)
- `purpose` (optional): `design-system` (default), `prototyping`, or `both` —
  determines which checks are blockers vs. warnings

## Workflow

### Step 1 — Connectivity sanity check

Verify the Figma MCP tools respond (`get_variable_defs` on the target). If
the connection itself fails, stop and hand over to the `mcp-doctor` skill
instead of producing a readiness report.

### Step 2 — Run the audit checks

**Variables & tokens** (blocker for `design-system`)
- Does the file define variables/styles at all? Empty `get_variable_defs`
  on a file meant to seed a design system is a blocker.
- Are collections organized (color / typography / spacing separated, groups
  used) or is everything one flat list?
- Sample 5–10 representative nodes via `get_design_context`: do fills,
  text styles, and spacing reference variables/styles, or raw values? Estimate
  the ratio. >30% raw values = warning; >70% = blocker.

**Components** (blocker for `prototyping`)
- Are repeated UI elements actual components, or copy-pasted frames?
  Use `search_design_system` for obvious names (button, input, card, modal,
  nav). Zero hits on a UI file = blocker.
- Do components use variants for states, or exist as disconnected
  near-duplicates (`button-hover-final-v2`)?
- Do components have descriptions? (warning only)

**Structure & naming**
- Auto layout coverage on sampled frames: absolute-positioned screens are a
  blocker for reliable code generation.
- Layer naming: high share of `Frame 427` / `Rectangle 12` = warning.
- Are screens organized into pages/sections with meaningful names? (warning)

**RWD readiness** (only when `purpose` includes prototyping)
- Do key screens exist in more than one breakpoint, or carry constraints/
  min-max widths that document responsive intent? Single-breakpoint designs
  are a warning: prototypes will require the agent to invent responsive
  behavior, which must be flagged as assumption, not fact.

### Step 3 — Report

Produce a readiness report addressed to the user (and save it to
`design-system/docs/figma-readiness-report.md` if the repo exists):

```
# Figma Readiness Report — <file name>, <date>

Verdict: READY | READY WITH WARNINGS | NOT READY

## Blockers (must fix before extraction)
- [ ] No variables defined — define color/spacing/typography variables first
...

## Warnings (extraction will work, quality will suffer)
- [ ] ~45% of sampled nodes use raw hex values instead of variables
...

## Recommendations
- Organize variables into collections: color, typography, spacing
...

## What was checked
<list of checks + sample size, for transparency>
```

Every blocker must include a one-line instruction for the designer on how to
fix it in Figma. Keep the tone helpful, not bureaucratic — the goal is a
designer-friendly to-do list.

## Hard rules

1. Read-only — never "fix" the file, even for trivial issues. Suggest fixes.
2. Always state sample sizes; never claim "all frames" when 10 were sampled.
3. A NOT READY verdict must never silently abort a user's original request:
   present the report and ask whether to proceed anyway (best-effort mode)
   or wait for fixes.

## Example invocations

- "Check if our Figma file is ready for design system extraction"
- "/figma-readiness https://figma.com/design/abc…"
- "The extraction gave weird tokens — audit the source file"
