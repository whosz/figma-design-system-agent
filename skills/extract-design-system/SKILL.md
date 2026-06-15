---
name: extract-design-system
description: >
  Extract a complete design system from a Figma file via MCP: variables →
  design tokens (CSS custom properties + W3C JSON, all modes/themes), and a
  full component inventory covering every variant axis and EVERY interaction
  state (hover, focus, pressed, disabled, error, loading…). Use when the
  user says "extract the design system", "pull the tokens from Figma",
  "create a design system from this file", "from zero", or wants to refresh/
  update an existing extraction after the Figma file changed.
---

# Extract Design System

The foundation skill: turns a Figma file into the repo's design system —
token files everything else styles with, and a component inventory
everything else builds from. Two modes: **full** (from zero) and **update**
(diff against an existing extraction). Every extraction is stamped with its
source and timestamp so `validate-extraction` and staleness checks can do
their job.

## Inputs

- `target`: Figma file URL (or current selection on the local server)
- `mode`: auto-detected — `full` when `design-system/tokens/` is empty,
  `update` otherwise; the user can force either
- `scope` (optional): `tokens`, `components`, or `all` (default)

## Pre-flight (cheap checks, in order)

1. Figma tools respond (one `get_variable_defs` probe) — on failure, hand
   off to `mcp-doctor`.
2. First run on this file ever? Recommend `figma-readiness-check` first;
   if the user declines, proceed best-effort and say so.
2a. **Showcase page preference** (ask once per project, before extraction
    starts): unless `target-profile.json` already contains a
    `showcaseAutoUpdate` field, ask the user:
    > "As I extract and generate components, should I automatically
    > maintain a component gallery page (`showcase/components.html`) so
    > you always have an up-to-date visual overview? (yes / no)"
    - `yes` (default) → set `showcaseAutoUpdate: true` in
      `target-profile.json`; `generate-component` will regenerate the
      gallery after each component build.
    - `no` → set `showcaseAutoUpdate: false`; the gallery is only built
      when `showcase-pages` is invoked explicitly.
    If the field already exists, skip the question and respect the saved
    preference.
3. **Dedicated library page**: check `design-system/docs/figma-readiness-report.md`
   for a recorded "Library pages" entry. If not present, call `get_metadata`
   to scan page names (same logic as `figma-readiness-check`). If a dedicated
   page is found, set it as the **primary extraction scope** for components
   and variable descriptions. If not found and the readiness check wasn't run,
   ask the user once:
   > "Does this Figma file have a dedicated components or variables page?
   > Share its URL or page name and I'll use it as the primary source."
   If the user says no, proceed with a whole-file scan.
4. `design-system/library-manifest.json` exists (an adopted code library)?
   Token extraction then runs in **reconcile mode**: the manifest's
   conflict decisions apply, and components are inventoried for *mapping*,
   not regeneration (per AGENTS.md resolution order).

## Step 1 — Tokens

Fetch `get_variable_defs` for the full file and transform:

- **All collections, all modes.** Extract every collection (color,
  typography, spacing, radius, effects…) and every mode (light/dark,
  brand A/B). Single-mode extraction of a multi-mode file is a defect.
- **Naming**: Figma's `collection/group/name` hierarchy maps 1:1 to token
  names — `color/primary/600` → `--color-primary-600`. Record the mapping
  convention in the output header; never "improve" designer naming.
- **Outputs** (all kept in sync; formats generated based on `target-profile.json`):
  - `design-system/tokens/*.css` — one file per collection; modes as
    `[data-theme="dark"]` / `prefers-color-scheme` blocks (per target
    profile when it exists). Always generated.
  - `design-system/tokens/tokens.json` — W3C Design Tokens / DTCG format
    with `$type`/`$value`/`$description`, aliases preserved as references
    (Figma variable aliases → token references, never flattened). Always
    generated.
  - `design-system/tokens/*.scss` — SCSS variables (`$color-primary-600:
    #2563eb;`) with a `@forward` barrel file. Generated when
    `cssApproach` is `scss` or when explicitly requested.
  - `design-system/tokens/tokens.ts` — TypeScript `as const` object
    (`export const tokens = { color: { primary: { 600: '#2563eb' } } }
    as const`) with inferred types. Generated when the target tier is
    `framework-app` or when explicitly requested.
  - `design-system/tokens/tailwind.config.js` — Tailwind theme extension
    mapping every token to a Tailwind key. Generated when `cssApproach`
    is `tailwind`.
- **Units**: px values kept as authored plus a documented rem conversion
  (base recorded in `tokens.json` `$extensions`); colors normalized to a
  single format (hex / oklch — ask once on first run, record the choice).
- Styles (text styles, effect styles) that aren't variables yet are
  extracted as **composite tokens** (typography token = family + size +
  weight + line-height) and flagged in the report: "defined as styles, not
  variables — consider migrating in Figma".

## Step 2 — Component inventory

Enumerate library components (`search_design_system`, plus page scan for
local components) and for each, via `get_design_context`:

- **Every variant axis with every value** — `state`, `size`, `type`,
  `theme`… nothing sampled, nothing defaulted.
- **Every interaction state — the non-negotiable rule.** Capture each state
  variant's full styling delta (what changes on hover/focus/pressed/
  disabled/error/loading relative to default). Where Figma encodes states
  as separate components (`Button/Hover`) instead of variants, merge them
  into one logical component and note the source structure. Interactive
  components missing expected states in Figma are recorded as **source
  gaps** in the report — not silently skipped, not invented.
- Properties: text props, booleans, instance-swap slots; sub-component
  dependencies (Card → Button) recorded so generation can order itself.
- Token references per property — the inventory stores *token names*, raw
  values only where the design itself is raw (each one flagged).
- Per-entry metadata: Figma node id, component key, last-modified, link.
- **Descriptions and documentation** (extracted when present):
  - Component description field (Figma's built-in description on each
    component / component set) → stored in `inventory.json` as
    `description`.
  - Annotation text frames on the dedicated library page — free-standing
    text nodes placed near a component that document its usage, behaviour
    or design decisions → stored as `docs` (array of strings, in reading
    order). If none, the field is omitted rather than set to `[]`.
  - Variable descriptions from `get_variable_defs` → stored per-token in
    `tokens.json` under `$description`.
  These fields are included verbatim — never paraphrased or summarized
  (AGENTS.md provenance rule 8).

Output: `design-system/inventory.json` + human-readable
`design-system/docs/inventory.md` (table: component × axes × states,
with description column where populated).

## Step 3 — Assets

Download vector/icon/logo assets referenced by inventoried components into
`design-system/assets/` (SVG preferred), deduplicated, named after their
Figma layer names. Record license/source notes when the file declares them.

## Step 4 — Stamp, log, hand off

- Stamp every output with `figma_source` (file key + version/last-modified)
  and `extracted_at` — required by `validate-extraction` and staleness
  checks.
- Append the work-log entry (AGENTS.md rule 9).
- **Update mode extras**: produce a diff report — tokens
  added/changed/removed, components/states added/changed/removed — before
  overwriting anything. Locally-marked `local-only` tokens are never
  deleted by an update; removed-in-Figma tokens are flagged, removal needs
  user confirmation (prototypes may depend on them).
- Final line of the report: "run `validate-extraction` now" — and offer to.

## Hard rules

1. All modes, all variant axes, all interaction states — partial
   extraction is failed extraction; gaps are reported, never papered over.
2. Aliases stay aliases; designer naming stays designer naming.
3. Update mode is diff-first: nothing local is destroyed without the diff
   being shown and destructive parts confirmed.
4. Every output carries source + timestamp stamps.
5. Extraction reads Figma; it never writes to it.

## Example invocations

- "Extract the design system from <link>"
- "Stwórz design system od zera z tego pliku" / "from zero"
- "/extract-ds update" (after the designers shipped changes)
