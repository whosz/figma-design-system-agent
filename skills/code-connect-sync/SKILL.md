---
name: code-connect-sync
description: >
  Link Figma components to their code implementations using Figma Code
  Connect, so designers see real code snippets in Dev Mode and code generation
  reuses real components instead of synthesizing new ones. Run on demand only —
  use when the user says "set up Code Connect", "link components to code",
  "map Figma components to our codebase", or after generate-component has
  produced a stable set of components worth publishing the mappings for.
---

# Code Connect Sync (on-demand)

Creates and maintains the mapping between components in the Figma library and
their implementations in `design-system/components/`. With mappings in place,
Figma's Dev Mode shows the team real usage snippets, and the
`generate-component` / `build-rwd-prototype` skills can trust
`get_code_connect_map` to resolve a Figma node directly to an import path
instead of regenerating code.

**This skill never runs automatically.** It changes what the whole team sees
in Dev Mode, so it runs only on explicit request, and publishing mappings
always requires a final user confirmation.

## Inputs

- `target`: Figma file/library URL containing the components
- `scope` (optional): list of component names, or `all` (default)
- `mode`: `audit` (report current mapping coverage, default),
  `suggest` (propose new mappings, don't publish), or
  `publish` (create/update mappings after confirmation)

## Workflow

### Step 1 — Audit current state

Call `get_code_connect_map` for the target. Cross-reference with
`design-system/components/` and produce a coverage table:

```
| Figma component | Code file                         | Status      |
|-----------------|-----------------------------------|-------------|
| Button          | components/button/button.tsx      | mapped ✓    |
| Card            | components/card/card.tsx          | unmapped    |
| Badge           | —                                 | no code yet |
| (none)          | components/tooltip/tooltip.tsx    | no design   |
```

In `audit` mode, stop here and present the table. The two mismatch rows
(`no code yet`, `no design`) are also valuable input for the
`generate-component` and `code-to-figma` skills respectively — say so.

### Step 2 — Generate mapping proposals (`suggest` / `publish`)

For each unmapped pair:

1. Call `get_code_connect_suggestions` for the Figma node to get the
   recommended linking strategy.
2. Call `get_context_for_code_connect` to retrieve the component's
   properties and variants.
3. Read the code implementation and map **Figma properties → code props**
   explicitly: variant `state=disabled` → prop `disabled: true`, variant
   `size=lg` → prop `size="lg"`, text layer `Label` → prop `children`. Every
   Figma variant axis must map to something in code or be listed as a gap.
4. Draft the mapping (and, for file-based Code Connect setups, the
   `*.figma.tsx` file in the component's directory) following the project's
   framework conventions.

### Step 3 — Review gate

Present all proposed mappings to the user as a diff-style summary:
component, node, code path, prop mapping table, gaps. Highlight any variant
or prop that could not be mapped — these are design/code drift and belong in
the report regardless of whether the user publishes.

### Step 4 — Publish (only in `publish` mode, only after explicit "yes")

Send the confirmed mappings via `send_code_connect_mappings` (bulk) or
`add_code_connect_map` (single). Re-run the Step 1 audit afterwards to
verify, and commit any generated `*.figma.*` files to the repo so mappings
are versioned with the code.

## Hard rules

1. On-demand only; publishing always behind explicit confirmation.
2. One component = one mapping; never map two Figma components to the same
   code file without flagging it as probable design-side duplication.
3. Unmappable variants/props are reported, never silently dropped.
4. Mapping definitions live in the repo next to the component they describe.

## Example invocations

- "/code-connect audit"
- "Set up Code Connect for Button, Input and Card"
- "Publish the Code Connect mappings we reviewed"
