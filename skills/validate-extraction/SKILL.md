---
name: validate-extraction
description: >
  Verify that data extracted FROM Figma is correct and complete before
  anything is built on top of it: design tokens vs. Figma variables
  (round-trip check), component inventories including ALL interaction states
  (hover, pressed, focus, disabled, error, loading…), and extracted
  prototype/flow data vs. the source file. Use immediately after
  extract-design-system or extract-app-flows, before generation skills
  consume the data, when generation produces suspicious results, when the
  user asks "is the extracted data correct / up to date", or when the Figma
  file may have changed since the last extraction.
---

# Validate Extraction

The quality gate between *reading* Figma and *building* from it. Other
audit skills cover different boundaries: `figma-readiness-check` judges the
**source file** before extraction; `design-fidelity-audit` judges the
**final implementation** against designs. This skill judges the middle
layer — whether the agent's local snapshot of Figma (tokens, component
inventory, prototype/flow data) faithfully and completely represents what
is actually in the file *right now*.

Read-only on both sides: it never edits Figma and never "fixes" local
artifacts itself — it reports, and repairs are re-runs of the extraction
skills.

## Inputs

- `scope`: `tokens`, `components`, `prototype`, `flows`, or `all` (default)
- `target`: the Figma file URL the artifacts were extracted from (read from
  the artifacts' own metadata when recorded there — extractions must stamp
  their source; flag it as a finding if they didn't)
- `strict` (optional): treat staleness (file edited after extraction) as
  failure rather than warning

## Workflow

### Part A — Design system data

**A1. Token round-trip.** Re-fetch `get_variable_defs` fresh and compare
against `design-system/tokens/` (CSS custom properties + tokens JSON):

- **Completeness**: every Figma variable has a local token; every local
  token traces to a Figma variable (or is explicitly marked `local-only`).
  Orphans on either side are findings.
- **Value equivalence**: values match after unit normalization (px↔rem per
  the project's documented base; color format conversions verified
  numerically, not as strings; alpha preserved).
- **Structure**: collection/group hierarchy from Figma is preserved in token
  naming; mode/theme variants (light/dark) all extracted, not just the
  default mode.
- **Internal consistency**: CSS files and tokens JSON agree with each other;
  no token referenced by extracted components is missing from the token
  files.

**A2. Component inventory — with mandatory state coverage.** For each
component in the local inventory, fetch its current definition
(`get_design_context` / `search_design_system`) and check:

- **All variant axes captured** — not just the default variant. If Figma
  defines `state`, `size`, `type` axes, the extracted data must enumerate
  every value of every axis.
- **All interaction states present** — this check is non-negotiable. Build
  the state checklist per component from two sources: (1) variant values in
  Figma (hover, pressed/active, focus, disabled, error, loading, selected,
  visited…), and (2) the expected baseline for the component's category —
  an interactive component (button, input, link, checkbox, tab…) is
  *expected* to have at least default / hover / focus / pressed / disabled.
  Then classify:
  - state in Figma, missing from extraction → **extraction defect (fail)**
  - state expected for the category, absent in Figma → **source gap** —
    not this extraction's fault; route it to the `figma-readiness-check`
    report so the designer adds it
- **Properties and slots**: text properties, boolean props, instance-swap
  slots all present in the extracted spec.
- Sub-component dependencies resolved (an extracted `Card` that references
  `Button` requires `Button` in the inventory too).

### Part B — Prototype / flow data

**B1. Screen extraction completeness.** Every frame in the declared scope
was captured; per-breakpoint frames all present (not just desktop); text
content matches the file (catches extraction against a stale node id);
referenced assets exist locally and aren't zero-byte/placeholder files.

**B2. Flow data correctness** (when `flows/*.flow.json` exist). Re-read the
prototype reactions and compare with the graph: every Figma connection has
an edge, every `high`-confidence edge still exists in Figma, triggers point
at elements that exist on the captured screens, entry points match Figma's
flow starting points.

### Part C — Staleness

Compare the file's last-modified information against each artifact's
extraction timestamp. Edits after extraction → list which validated areas
the edits touch (when determinable) and recommend re-extraction. In
`strict` mode this fails the validation outright.

### Report

Save to `reports/validation/<date>.md` and summarize in chat:

```
# Extraction Validation — <file>, <date>

Verdict per scope:
tokens: PASS · components: FAIL (3) · prototype: PASS · flows: WARN (stale)

## Failures
1. [components] Button: Figma defines state=pressed; missing from
   extracted inventory. Fix: re-run extract-design-system for Button.
2. [components] Input: no focus state in Figma (source gap) — added to
   figma-readiness follow-ups, not counted against extraction.
...
## State coverage matrix
| Component | default | hover | focus | pressed | disabled | …
| Button    |   ✓     |  ✓    |  ✓    |  MISSING(extraction) | ✓ |
```

The state coverage matrix is always included for `components` scope — it is
the single most useful artifact of this skill.

## Hard rules

1. Validation re-fetches from Figma; it never validates the snapshot
   against itself.
2. State coverage distinguishes *extraction defects* from *source gaps* —
   never blame the pipeline for what the designer didn't draw, and never
   excuse the pipeline by pointing at the designer.
3. Read-only; fixes happen by re-running extraction skills, optionally
   scoped to the failing items.
4. Every PASS states what was checked and sample sizes — a PASS without a
   checklist is worthless.

## Example invocations

- "Validate the extracted design system against Figma"
- "/validate components" (after adding new variants in Figma)
- Auto-suggested as the final step of extract-design-system and
  extract-app-flows, and as the first step when generation results look
  wrong.
