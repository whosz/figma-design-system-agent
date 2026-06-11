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
3. `design-system/library-manifest.json` exists (an adopted code library)?
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
- **Outputs** (both, kept in sync):
  - `design-system/tokens/*.css` — one file per collection; modes as
    `[data-theme="dark"]` / `prefers-color-scheme` blocks (per target
    profile when it exists)
  - `design-system/tokens/tokens.json` — W3C Design Tokens format with
    `$type`/`$value`, aliases preserved as references (Figma variable
    aliases → token references, never flattened to raw values)
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

Output: `design-system/inventory.json` + human-readable
`design-system/docs/inventory.md` (table: component × axes × states).

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
