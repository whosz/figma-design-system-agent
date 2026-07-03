---
name: ds-checklist
description: >
  Generate, display, and manage a structured DS alignment checklist — a
  prioritised task list of everything needed to synchronise Figma DS with
  the codebase. Tasks fall into five categories: naming fixes, design tokens,
  Figma→Code (implement), Code→Figma (document), and component tweaks. Use
  when the user asks "what do we still need to do for the DS", "generate a
  task list", "show me the checklist", "mark X as done", or at the start of
  a DS sprint to plan the work. Pairs well with ds-gap-analysis (to discover
  items) and ds-naming-audit (to populate naming tasks).
---

# DS Checklist

Turns the raw output of gap analysis and naming audits into a structured,
prioritised, filterable task list. Can generate a fresh checklist from
analysis results, display the current state, add individual tasks, and
mark tasks done. Persists to `design-system/ds-checklist.json` so state
survives across sessions.

## Modes

| Mode | When to use |
|------|-------------|
| `generate` | Fresh checklist from ds-gap-analysis + ds-naming-audit output |
| `status` | Display current checklist with progress |
| `add <category> <title> [priority]` | Add a single task |
| `done <task-id or title fragment>` | Mark a task complete |
| `export` | Export checklist as markdown or HTML |

## Categories

| ID | Category | What goes here |
|----|----------|----------------|
| `naming` | Naming fixes | Typos in Figma/code, alias decisions, rename tasks |
| `tokens` | Tokens & fundamentals | Token migration, missing variables, icon library swap, typography |
| `figma-to-code` | Figma → Code | Components that exist in Figma DS but not yet in code |
| `code-to-figma` | Code → Figma | Components in code that need Figma documentation |
| `components` | Component tweaks | Minor fixes — hover states, border radii, missing variants |

## Priorities: `critical` | `high` | `medium` | `low`

## Workflow — generate mode

### Step 1 — Collect input

Read from (in order of preference):
1. `reports/ds-gap-analysis-<latest>.json` — if present and < 7 days old
2. `design-system/naming-aliases.json` — for naming tasks
3. `design-system/library-manifest.json` — for component metadata
4. Ask the user to run `ds-gap-analysis` and `ds-naming-audit` first if none found

### Step 2 — Populate categories

**Naming tasks** (from naming-aliases.json):
- One task per Figma typo: "Rename Figma: {wrong} → {correct}"
- One task per semantic alias with canonical decision: "Align naming: {figma} ↔ {code}"

**Token tasks** (from gap-analysis + extraction):
- Missing token definitions: "Define token: {name}"
- Hardcoded values found during extraction: "Replace hardcoded {value} with token"
- Icon library mismatch (if detect-icon-library flagged it): "Migrate icons: {old} → {new}"

**Figma → Code tasks** (Bucket A from gap-analysis):
- One task per component: "Implement: {component}"
- Priority inherited from gap-analysis scoring

**Code → Figma tasks** (Bucket B from gap-analysis):
- One task per component: "Document in Figma: {component}"
- Priority inherited from gap-analysis scoring

**Component tweak tasks** (Bucket C partial alignments):
- One task per misaligned property: "{Component}: fix {property} ({figma-value} → {code-value})"

### Step 3 — Assign IDs and save

Assign stable IDs: `{category-prefix}{number}` — e.g. `n1`, `t3`, `f2c4`, `c2f2`, `cmp7`.
Save to `design-system/ds-checklist.json`:

```json
{
  "version": 1,
  "generated": "<ISO timestamp>",
  "tasks": [
    {
      "id": "n1",
      "category": "naming",
      "title": "Rename Figma: Devider → Divider (×3 nodes)",
      "priority": "high",
      "done": false,
      "doneAt": null,
      "notes": "Node IDs: 123:45, 123:46, 123:47"
    }
  ]
}
```

## Workflow — status mode

Read `design-system/ds-checklist.json` and print:

```
# DS Checklist — <date>
Total: X tasks | Done: Y | Remaining: Z | Progress: W%

## Naming fixes (X/Y done)
  [✓] n1  Rename Figma: Devider → Divider (×3)
  [ ] n2  Rename Figma: Sw → Switch
  [ ] n3  Align naming: Toast ↔ Alert — pick canonical

## Tokens & fundamentals (X/Y done)
  [ ] t1  Migrate icons: icomoon → Heroicons (critical)
  [ ] t2  Define spacing scale tokens in Figma variables

## Figma → Code (X/Y done)
  [ ] f2c1  Implement: DatePicker  [critical]
  [ ] f2c2  Implement: Badge       [high]

## Code → Figma (X/Y done)
  [ ] c2f1  Document in Figma: ProjectCard  [high]
  [ ] c2f2  Document in Figma: Modal        [high]

## Component tweaks (X/Y done)
  [ ] cmp1  Button: align border-radius (Figma 30px, code 4px)  [high]
  [ ] cmp2  Input: add focus ring state  [medium]

Next critical actions:
  1. t1 — icon migration blocks many component updates
  2. f2c1 — DatePicker needed for release milestone
```

## Workflow — add mode

Parse `<category> <title> [priority]` from arguments.
Validate category against the five categories.
Assign the next ID in that category's sequence.
Append to `design-system/ds-checklist.json`.
Confirm: "Added [n4] — 'Rename Figma: Accordeon → Accordion' (medium)"

## Workflow — done mode

Find task by ID or case-insensitive title fragment.
If multiple matches, list them and ask user to confirm.
Set `done: true` and `doneAt: <ISO timestamp>`.
Confirm: "[n1] marked done — Rename Figma: Devider → Divider"

## Workflow — export mode

Emit a markdown file to `reports/ds-checklist-<date>.md` with the full
checklist, grouped by category, with checkboxes (`- [x]` / `- [ ]`).
Suitable for pasting into GitHub Issues, Notion, or Linear.

## Hard rules

1. IDs are stable — never reassign an ID, even after items are deleted.
2. `done` state is the source of truth in JSON; never infer from Figma or code.
3. Never auto-generate tasks that duplicate existing done tasks.
4. Append a JSON summary line to `reports/work-log.jsonl` on completion.
5. If gap-analysis or naming-audit JSON is stale (> 7 days), warn before generating.

## Example invocations

- "Generate a DS checklist from the gap analysis"
- "Show me what's left on the DS checklist"
- "Mark the Devider rename as done"
- "Add a task: Input — add loading state" (high)
- "Export the checklist to markdown"
