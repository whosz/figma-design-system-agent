---
name: ds-gap-analysis
description: >
  Compare the Figma DS component inventory against the codebase component
  inventory and classify every component into one of three buckets: Figma-only
  (needs implementation), Code-only (needs Figma documentation), or Both
  (exists in both — verify alignment). Use when the user asks "what's missing
  from the code", "what's not documented in Figma", "show me the DS coverage",
  "what do we still need to build", or before starting a new DS sprint to
  understand scope. Run after extract-design-system so the local inventory
  exists.
---

# DS Gap Analysis

Answers the question: **what exists where?** Compares the Figma DS component
inventory (from extraction or live MCP) against the codebase component list
and produces a three-bucket report with prioritised action items.

This is a read-only audit skill — it reports and classifies, never modifies
files or Figma.

## Inputs

- `figmaFileUrl` — Figma file URL or file key
- `codebasePath` — root path of the project (defaults to repo root)
- `componentDirs` — comma-separated paths to search for components; if
  omitted the skill auto-discovers common patterns (`src/components`,
  `storybook/src/components`, `components/`, `app/components/`, etc.)
- `outputFormat` — `report` (default) | `json` | `checklist`

## Workflow

### Step 1 — Build Figma inventory

If `design-system/library-manifest.json` exists and is recent (< 24 h),
read it. Otherwise fetch live from Figma MCP:
- Call `get_metadata` to get file name and last-modified
- Call `get_variable_defs` to enumerate component sets
- Call `search_design_system` with a broad query to get full component list

Extract for each component:
- Name (canonical, as spelled in Figma)
- Category / section
- Whether it has documented variants/states
- Node ID for deep-link

### Step 2 — Build codebase inventory

Scan `componentDirs` recursively for component files:
- `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html` component files
- Exclude: test files (`*.test.*`, `*.spec.*`, `*.stories.*`), generated
  folders (`dist/`, `.next/`, `node_modules/`, `__snapshots__/`)

For each file, extract the component name:
- Default export name or filename stem
- Handle common patterns: `Button.tsx`, `Button/index.tsx`, `ButtonGroup.tsx`

Build a flat list of code component names.

### Step 3 — Reconcile with known aliases

Before bucketing, apply alias normalisation so near-matches aren't treated
as gaps. Load `design-system/naming-aliases.json` if present, otherwise use
heuristics:
- Case-insensitive exact match: `button` = `Button`
- Singular/plural: `Badge` = `Badges`
- Common semantic aliases (populate from naming-audit output):
  `Toast` ↔ `Alert`, `AccordionItem` ↔ `FAQ`, `Tabs` ↔ `TogglePills`

Flag unresolved near-matches (Levenshtein ≤ 2) as **ambiguous** — report
them separately for human review rather than mis-classifying.

### Step 4 — Classify into three buckets

| Bucket | Condition | Default action |
|--------|-----------|----------------|
| **A — Figma only** | In Figma DS, not found in codebase | Implement in code |
| **B — Code only** | In codebase, not found in Figma DS | Document in Figma |
| **C — Both** | Present in both (after alias resolution) | Verify alignment |

For bucket C, additionally note:
- Whether variants/states in Figma are mirrored in code props/CSS
- Whether the component is referenced in `library-manifest.json` (extracted)

### Step 5 — Prioritise

Score each gap item by:
- **Usage frequency** — how often the component appears in templates/pages
  (grep for component name in template files; count occurrences)
- **Variant count** — more variants in Figma → higher implementation value
- **User-facing criticality** — interactive components (buttons, inputs,
  modals) score higher than decorative ones

Assign priority: `critical` | `high` | `medium` | `low`.

### Step 6 — Report

```
# DS Gap Analysis — <file name> — <date>

Coverage: X Figma components | Y code components | Z in both (W%)

## Bucket A — Implement in code (X components)
Components that exist in Figma DS but have no code counterpart.

| Priority | Component | Figma variants | Notes |
|----------|-----------|----------------|-------|
| critical | DatePicker | 4 states | Used on 3 pages |
| high     | Badge      | 3 variants | — |

## Bucket B — Document in Figma (Y components)
Components that exist in code but are missing from the Figma DS.

| Priority | Component | File | Notes |
|----------|-----------|------|-------|
| high     | ProjectCard | ProjectCard.tsx | Key product UI |
| medium   | PaymentProgress | PaymentProgress.tsx | — |

## Bucket C — Verify alignment (Z components)
Present in both — run design-fidelity-audit on critical ones.

| Component | Code file | Figma node | States match | Tokens match |
|-----------|-----------|------------|--------------|--------------|
| Button    | Button.tsx | 802:6305   | partial      | ✓ |
| Input     | Input.tsx  | 886:198    | ✓            | partial |

## Ambiguous (review manually)
| Code name | Figma name | Similarity |
|-----------|------------|------------|
| Alert     | Toast      | likely alias |

## Recommended next steps
1. Run `ds-naming-audit` to resolve aliases before re-running this skill
2. Run `generate-component` on Bucket A critical items
3. Run `design-fidelity-audit` on Bucket C items with `partial` alignment
4. Run `code-to-figma` on Bucket B high-priority items
```

If `outputFormat: json`, emit the full structured result as JSON to
`reports/ds-gap-analysis-<date>.json`. If `outputFormat: checklist`, emit
a markdown task list grouped by bucket and priority.

## Hard rules

1. Never modify source files or Figma — read-only audit.
2. Always normalise aliases before bucketing; never double-count.
3. Mark ambiguous items as ambiguous; never force-classify.
4. Coverage percentage = (Bucket C count) / (Figma component count) × 100.
5. Append a JSON summary line to `reports/work-log.jsonl` on completion.

## Example invocations

- "What's missing from our code vs Figma?"
- "Show me the DS coverage"
- "Gap analysis before we start the sprint"
- Run automatically as step 0 when starting a new DS implementation sprint
