---
name: ds-naming-audit
description: >
  Detect and resolve naming mismatches between Figma DS component names and
  codebase component names. Covers three classes of mismatch: typos/errors in
  Figma (e.g. "Devider", "Sw"), semantic aliases (e.g. Figma "Toast" = Code
  "Alert"), and convention differences (PascalCase vs kebab-case, singular vs
  plural). Produces a reconciliation table and an editable alias map. Use when
  the user asks "why can't the agent find this component", "reconcile names",
  "Figma calls it X but code calls it Y", or before running ds-gap-analysis
  to improve match quality.
---

# DS Naming Audit

Mismatched names between Figma and code are the most common cause of
false gaps in DS coverage analysis. This skill finds and documents every
naming mismatch so humans can decide what to rename where — and the agent
can reliably match components across systems.

Read-only: the skill proposes renames and writes `design-system/naming-aliases.json`
as a machine-readable alias map, but never modifies source files or Figma
nodes (renaming requires explicit user confirmation per AGENTS.md rule 7).

## Inputs

- `figmaFileUrl` — Figma file URL or file key
- `codebasePath` — root path of the project (defaults to repo root)
- `componentDirs` — paths to search for components (same defaults as ds-gap-analysis)

## Workflow

### Step 1 — Collect names from both sides

**Figma names:** extract all component set names from Figma MCP
(`search_design_system`, `get_metadata`). Collect raw names exactly as
they appear — do not normalise yet.

**Code names:** scan component files (same logic as ds-gap-analysis Step 2),
extract component name from export or filename.

### Step 2 — Classify mismatches

Run each Figma name against each code name using four detectors:

**Detector 1 — Typos/errors in Figma**
Symptoms: misspelling that deviates from standard English or obvious intent.
Method: check against a dictionary; flag words not found.
Examples: `Devider` (→ `Divider`), `Sw` (→ `Switch`), `Accordeon` (→ `Accordion`).
Action: rename in Figma.

**Detector 2 — Typos/errors in code**
Symptoms: same as above but on the code side.
Action: rename in code.

**Detector 3 — Semantic aliases**
Symptoms: different names, same component (confirmed by visual similarity
or description match from Figma).
Method: fuzzy match + check Figma component description for code references.
Examples: `Toast` ↔ `Alert`, `AccordionItem` ↔ `FAQ`, `Tabs` ↔ `TogglePills`.
Action: add to alias map; decide canonical name (prefer Figma DS or agreed convention).

**Detector 4 — Convention differences**
Symptoms: same component name, different formatting.
Examples: `toggle-pills` vs `TogglePills`, `Button Group` vs `ButtonGroup`.
Method: normalise both to lowercase-no-separator and compare.
Action: add to alias map; no rename needed unless convention is being standardised.

### Step 3 — Determine action per mismatch

For each mismatch, recommend:

| Class | Recommended action | Owner |
|-------|-------------------|-------|
| Figma typo | Rename Figma node | Designer |
| Code typo | Rename code file/export | Developer |
| Semantic alias (keep both names) | Add to alias map | Agent/both |
| Semantic alias (consolidate) | Pick canonical, rename the other | Team decision |
| Convention difference | Add to alias map | Agent |

Flag cases where the same alias already appears in `naming-aliases.json`
to avoid duplicates.

### Step 4 — Write alias map

Write or update `design-system/naming-aliases.json`:

```json
{
  "version": 1,
  "generated": "<ISO timestamp>",
  "aliases": [
    {
      "figma": "Toast",
      "code": "Alert",
      "class": "semantic-alias",
      "canonical": "Alert",
      "note": "Rename Figma Toast → Alert in DS 2.0 to align"
    },
    {
      "figma": "Devider",
      "code": "Divider",
      "class": "figma-typo",
      "canonical": "Divider",
      "note": "Three Figma nodes named Devider — rename all"
    }
  ]
}
```

### Step 5 — Report

```
# DS Naming Audit — <file name> — <date>

Found X mismatches: Y typos, Z semantic aliases, W convention differences

## Figma typos (rename in Figma)
| Figma name | Should be | Occurrences | Node IDs |
|------------|-----------|-------------|----------|
| Devider    | Divider   | 3           | 123:45, 123:46, 123:47 |
| Sw         | Switch    | 1           | 456:78 |

## Code typos (rename in code)
| Code name | Should be | File |
|-----------|-----------|------|
| Toogle    | Toggle    | ToggleButton.tsx |

## Semantic aliases (same component, different name)
| Figma name | Code name    | Recommended canonical | Action |
|------------|--------------|----------------------|--------|
| Toast      | Alert        | Alert                | Rename Figma |
| AccordionItem | FAQ       | FAQ                  | Rename Figma |
| tabs       | TogglePills  | TogglePills          | Rename Figma |

## Convention differences (no rename needed)
| Figma name   | Code name   | Normalised |
|--------------|-------------|-----------|
| Button Group | ButtonGroup | buttongroup |
| toggle-pills | TogglePills | togglepills |

## Written to
`design-system/naming-aliases.json` — X entries

## Next steps
1. Share the "Figma typos" table with your designer — 5 min to fix in Figma
2. Re-run `ds-gap-analysis` — alias map will now match aliases automatically
3. Run `extract-design-system` after Figma renames to refresh the inventory
```

## Hard rules

1. Never rename files, exports, or Figma nodes without explicit user "yes".
2. Always preserve the original spelling in the alias map — both directions.
3. Flag but do not auto-resolve cases where the same Figma name maps to
   multiple code names (genuine ambiguity — needs human decision).
4. Append a JSON summary line to `reports/work-log.jsonl` on completion.

## Example invocations

- "Audit the naming between Figma and our code"
- "Why does the agent keep saying Toast doesn't exist?"
- "Reconcile component names"
- Run before `ds-gap-analysis` for best results
