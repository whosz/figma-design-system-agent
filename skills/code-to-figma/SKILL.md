---
name: code-to-figma
description: >
  Generate Figma designs (screens, components, variables) from existing code
  prototypes and the project's design system tokens. Use this skill whenever the
  user wants to sync code back to Figma, create Figma frames from HTML/CSS or
  component code, "push" a prototype to Figma, recreate an implemented screen as
  a design, or bootstrap a Figma library from an existing codebase — even if
  they don't explicitly say "Figma" but mention turning code into designs or
  mockups. Requires the official Figma MCP server (tools: use_figma,
  search_design_system, get_variable_defs, get_screenshot, upload_assets,
  create_new_file).
---

# Code → Figma Synthesis

This skill reverses the usual design-to-code flow: it takes a working prototype
from `prototypes/` (or any HTML/CSS/component file the user points to) plus the
design tokens in `design-system/tokens/`, and produces editable, well-structured
Figma designs that reference Figma variables instead of hardcoded values.

The output must be something a designer can actually work with: auto layout
everywhere, real components with variants, variables bound to every visual
value. A pixel-accurate but frozen "screenshot rebuilt in Figma" is a failure.

## Prerequisites — verify before starting

1. **Figma MCP server is connected.** Confirm the following tools are
   available: `use_figma`, `search_design_system`, `get_variable_defs`,
   `get_screenshot`, `upload_assets`, `create_new_file`. If any are missing,
   stop and tell the user how to enable the Figma MCP server (local Dev Mode
   server at `http://127.0.0.1:3845/mcp` or remote `https://mcp.figma.com/mcp`).
2. **A target exists.** Ask the user for a Figma file link (the file must be
   editable by them), or ask whether to create a new file with
   `create_new_file`. Never guess the target file.
3. **Design tokens exist.** Read `design-system/tokens/` (CSS custom
   properties and/or the W3C tokens JSON). If the folder is empty, this is the
   "bootstrap from code" scenario — see *Scenario B* below.
4. **The source prototype exists.** If the user didn't specify a file, list
   `prototypes/` and ask which one to sync.

## Inputs

- `source`: path to a prototype (HTML file, component file, or directory)
- `target`: Figma file URL, or `new` to create a fresh file
- `scope` (optional): `screen` (default), `components-only`, or `full`
  (components + screens + variables)
- `breakpoints` (optional): which RWD variants to generate; defaults to the
  breakpoints defined in `design-system/docs/breakpoints.md`

## Workflow

### Step 1 — Parse the source into an intermediate representation

Read the prototype and the design tokens. Build an in-memory description (do
not write it to disk unless debugging) containing:

- **Layout tree**: the element hierarchy with layout semantics. Map CSS to
  Figma concepts explicitly:
  - `display: flex` → auto layout (direction, gap, padding, alignment)
  - `display: grid` → nested auto layout frames approximating the grid; note
    in the report when the approximation is lossy
  - `position: absolute` → only allowed for genuinely overlapping decorative
    elements; everything else must become auto layout
- **Style map**: every color, font, spacing, radius, and shadow value resolved
  **back to its token name**, not its raw value. `#2563EB` is wrong;
  `color/primary/600` is right. If a value in the prototype does not match any
  token, flag it as a *token violation* in the final report — do not silently
  invent a new token.
- **Component candidates**: repeated subtrees and elements matching files in
  `design-system/components/` (buttons, inputs, cards, …), including their
  states (`:hover`, `:disabled`, `:focus`, media-query differences).
- **Assets**: images, illustrations, and custom icons referenced by the
  prototype, with local paths.

### Step 2 — Map against the existing Figma library

Before creating anything, call `search_design_system` for every component
candidate (search by name and by obvious synonyms, e.g. "button", "btn",
"primary button").

- **Match found** → plan to place an *instance* of the existing library
  component. Never recreate a component that already exists.
- **No match** → plan to create a new component (Step 4).

This step is mandatory. Skipping it pollutes the file with duplicates and is
the most common failure mode of this skill.

### Step 3 — Ensure variables exist in the target file

Call `get_variable_defs` on the target file and diff against the local tokens:

- Missing variables → create them via `use_figma`, preserving the local naming
  scheme and collection structure (e.g. collection `color`, group `primary`).
- Conflicting values (same name, different value) → **do not overwrite**.
  List the conflicts and ask the user whether Figma or code is the source of
  truth for each, then proceed accordingly.

Every visual property generated later must bind to a variable. No raw values.

### Step 4 — Generate components

For each component candidate without a library match, use `use_figma` to
create a proper Figma component:

- Auto layout with padding/gap bound to spacing variables
- CSS pseudo-class and state styles become **variants** on a single component
  set (e.g. `state=default | hover | disabled`)
- Size differences across breakpoints become a `size` or `breakpoint` variant
  only when the differences are structural; pure fluid scaling does not need
  variants
- Name components exactly as they are named in `design-system/components/`
  so the two libraries stay in sync

### Step 5 — Generate screens

For each screen in scope, and for **each breakpoint** in `breakpoints`,
create a separate top-level frame via `use_figma`:

- Frame name: `[generated] <screen-name> / <breakpoint>` (e.g.
  `[generated] checkout / mobile-375`)
- Frame width matches the breakpoint; height hugs content
- Compose screens out of component *instances* from Steps 2 and 4 — never
  detached copies
- Upload required images first with `upload_assets`, then reference them

**Never overwrite or modify existing nodes in the target file.** All output
goes into new frames with the `[generated]` prefix, placed in a dedicated
section/page when possible. If a frame with the same generated name already
exists from a previous run, create a new one suffixed with a run timestamp and
mention the older copy in the report — deletion is the user's decision.

### Step 6 — Visual verification loop

After generation:

1. Render the source prototype locally (headless browser screenshot at each
   breakpoint) if the environment allows it; otherwise skip the pixel
   comparison and do a structural review only.
2. Call `get_screenshot` on each generated frame.
3. Compare structure, spacing rhythm, typography scale, and color usage.
   Ignore sub-pixel and font-rendering differences.
4. Fix clear defects via `use_figma` and re-verify. **Maximum 3 iterations**
   per frame — after that, list the remaining discrepancies in the report
   instead of looping forever.

### Step 7 — Report

Finish with a concise report to the user:

- Link(s) to the generated frames/file
- Components created vs. library instances reused (counts + names)
- Variables created in Figma
- Token violations found in the prototype (values that matched no token)
- Discrepancies that remain after the verification loop
- Any grid→auto-layout approximations worth a designer's attention

## Scenario B — bootstrapping with no design system ("DS from code")

If `design-system/tokens/` is empty, do not abort. Instead:

1. Extract candidate tokens from the prototype's CSS (cluster similar values:
   a palette, a type scale, a spacing scale).
2. Present the proposed token set to the user for confirmation **before**
   touching Figma.
3. On approval, write the tokens to `design-system/tokens/` (same formats as
   the `extract-design-system` skill produces), then continue from Step 3 with
   these tokens. This keeps code and Figma born from a single source.

## Hard rules

1. **Tokens before values** — every color, spacing, radius, font, and shadow
   binds to a Figma variable. Raw hex/px values in generated nodes are bugs.
2. **Auto layout always** — absolute positioning only for true overlays.
3. **Components, not groups** — anything reused twice becomes a component;
   states become variants.
4. **Reuse before create** — `search_design_system` runs before any component
   is created.
5. **Additive only** — never modify or delete existing nodes; everything new
   is `[generated]`-prefixed. Destructive changes require an explicit user
   request per node.
6. **Ask when ambiguous** — unclear target file, conflicting variables, or an
   unparseable layout: ask, don't guess.

## Error handling

- `use_figma` fails or produces a malformed node → retry once with a
  simplified instruction (fewer nodes per call); if it fails again, fall back
  to generating the screen section-by-section and report which section failed.
- MCP authentication error → stop and tell the user to re-authenticate the
  Figma connection; do not retry blindly.
- Prototype uses a framework you cannot statically parse (heavy runtime
  rendering) → render it in a headless browser and work from the computed DOM;
  if that's impossible, ask the user for a static export.

## Example invocations

- `/sync-to-figma prototypes/checkout.html → https://figma.com/design/abc…`
- "Push the pricing page prototype to our Figma library, mobile and desktop"
- "We built the dashboard in code first — create the Figma designs and set up
  the variables to match our tokens"
