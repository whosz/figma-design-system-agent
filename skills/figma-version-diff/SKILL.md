---
name: figma-version-diff
description: >
  Compare the current Figma file against the version captured at the last
  extraction, detect what changed (tokens, components, states, docs), and
  produce a human-readable changelog. Use when the user asks "what changed
  in Figma since last time", "did the designers update anything", "is our
  extraction still fresh", or before re-running extract-design-system to
  understand the scope of changes. Also useful as a gating step before a
  scheduled re-extraction in CI.
---

# Figma Version Diff

Answers the question "what changed in Figma since we last extracted?" before
committing to a full re-extraction. Compares the live file against the
stamps recorded by `extract-design-system` and produces a structured diff
and human-readable changelog.

Read-only — never modifies the Figma file or the local design system.

## Inputs

- Figma file URL (or the currently loaded file)
- `since` (optional): ISO timestamp or Figma version ID to diff against;
  defaults to the `extracted_at` stamp in `design-system/tokens/tokens.json`

## Pre-flight

1. Verify `design-system/tokens/tokens.json` and `design-system/inventory.json`
   exist and carry `figma_source` + `extracted_at` stamps. If absent, say:
   "No previous extraction found — run `extract-design-system` first."
2. Confirm Figma MCP is reachable (`get_metadata` probe).

## Step 1 — Detect Figma-side changes

### Token / variable changes

Call `get_variable_defs` on the live file. Diff against the values in
`tokens.json`:

- **Added**: variables present in Figma but absent from `tokens.json`
- **Removed**: variables in `tokens.json` no longer in Figma
- **Modified**: same name, different value or alias target
- **Renamed**: value match but name mismatch (best-effort, flag as probable)

### Component changes

Call `search_design_system` and compare against `inventory.json`:

- New components not in the inventory
- Removed components (in inventory but no longer findable)
- Variant/state changes — sample modified components via `get_design_context`
  and compare variant axes and state names

### Documentation / description changes

For components that existed before, check whether the Figma `description`
field changed — a designer may have added or updated documentation without
touching the visual design.

### Page / structure changes

Compare page count and names from `get_metadata` against the `figma_source`
recorded at extraction time.

## Step 2 — Classify impact

Assign each change an impact level:

| Level | Meaning | Auto-action |
|---|---|---|
| `breaking` | Removed token/component used in generated code | Block re-use; flag for user decision |
| `update` | Modified value/variant — extraction will override local tokens | Highlight in changelog |
| `additive` | New token/component only — no existing code affected | Note in changelog |
| `doc-only` | Description/annotation changed, no visual change | Note; offer to refresh docs only |

## Step 3 — Produce the changelog

Write `reports/figma-changelog-<date>.md`:

```markdown
# Figma Changelog — <file name>
Compared: <extracted_at> → <now>

## Breaking changes
- Token `color/primary/500` removed (was used by Button, Card)

## Updated
- Token `color/primary/600`: #1d4ed8 → #2563eb
- Component `Input`: new variant `state=loading` added

## Additive
- 3 new tokens: color/feedback/success/…

## Doc-only
- Button: description updated by designer

## Recommendation
Run `extract-design-system` (update mode) to pull all changes.
Affected components to regenerate: Button, Card.
```

Also summarize in chat (counts only, no file paths in chat output).

## Step 4 — Recommend next action

Based on the diff:

- **No changes**: "Extraction is current — no re-run needed."
- **Doc-only**: "Only descriptions changed — offer to refresh
  `docs-and-metrics` without a full re-extraction."
- **Additive only**: "New tokens/components available — run
  `extract-design-system` in update mode."
- **Breaking / update changes**: "Re-run `extract-design-system` (update
  mode) before generating. Breaking changes flagged above need your decision
  before proceeding." List the affected generated components.

## Hard rules

1. Read-only. No writes to Figma, no overwrites of local token or inventory
   files.
2. Every finding cites its source: `tokens.json` path or inventory component
   name. No vague "something changed."
3. `breaking` impact is never auto-resolved — always surfaces to the user.
4. Changelog is append-only if a previous run exists for the same date; a
   second run on the same day appends with a timestamp suffix.
5. Staleness threshold: if `extracted_at` is older than 30 days, prefix the
   report with a warning regardless of diff content.

## Example invocations

- "What changed in Figma since last time?"
- "/figma-version-diff"
- "Check if the extraction is still fresh before we generate the dashboard"
- "The designer said they updated the button — show me what changed"
