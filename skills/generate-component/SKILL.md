---
name: generate-component
description: >
  Generate a code component from the extracted design system — with every
  variant and every interaction state (hover, focus, pressed, disabled,
  error, loading…) implemented, styled exclusively through design tokens,
  and matching the project's target profile (static HTML/CSS through
  framework components). Use when the user asks to "create/generate the
  Button component", "implement <component> from Figma", "fill the DS gaps",
  or when build-rwd-prototype / docs-to-prototype reports a missing
  component.
---

# Generate Component

Turns one entry of `design-system/inventory.json` into working code. The
discipline: the inventory (validated against Figma) is the spec; the target
profile decides the technology; the tokens decide every visual value; and a
component without all of its states is not done.

## Gates (refuse to start until all pass)

1. `design-system/target-profile.json` exists — else run
   `target-profile-setup` first (one exchange).
2. The component exists in `design-system/inventory.json`, ideally
   validated (`validate-extraction` PASS for components; if not validated,
   warn and offer to validate first).
3. **Resolution order** (AGENTS.md rule 3): if `library-manifest.json`
   resolves the component to an existing library implementation — stop,
   point at it, and offer the *useful* alternatives instead: wrap it,
   extend it in the library's conventions, or run `code-connect-sync` to
   link it. Regenerating what exists is the one thing this skill must not
   do.

## Inputs

- `component`: name or Figma node id (must resolve in the inventory)
- `out` (optional): default `design-system/components/<kebab-name>/`

## Workflow

### Step 1 — Confirm Figma source page, then read the spec

Before reading the spec, verify that a direct Figma source for this
component is known. Check in order:
1. Was a Figma URL or page name provided in this request?
2. Does `inventory.json` carry a `figma_link` for this component?
3. Was a dedicated library page recorded in `design-system/docs/figma-readiness-report.md`?

If none of the above resolves to a concrete page, ask the user once:

> "Do you have a Figma page or frame URL for the **\<ComponentName\>**
> component? Sharing it lets me pull the latest design context directly.
> If not, I'll proceed from the extracted inventory."

Wait for the reply. If the user provides a URL, use it as the primary
`get_design_context` source and refresh the inventory entry before
generating. If the user says no or skips, proceed from the existing
inventory entry — note it in the output as `[source: inventory only]`.

From the inventory: variant axes and values, the per-state styling deltas,
properties/slots, sub-component dependencies, token references. Generate
dependencies first (Card needs Button) — depth-first, each through this
same skill.

Fetch `get_screenshot` for the default state and a couple of non-default
states as visual ground truth for the final self-check.

### Step 2 — Map states and variants to the target tier

Build the **state implementation table** before writing code — it goes
into the component's docs verbatim:

| Figma variant | Implementation (static tier) | Implementation (framework tier) |
|---|---|---|
| `state=hover` | `:hover` + `.is-hover` (forced class for galleries/tests) | `:hover` + visual-state prop/storybook control |
| `state=focus` | `:focus-visible` + `.is-focus` | same |
| `state=pressed` | `:active` + `.is-pressed` | same |
| `state=disabled` | `[disabled]` / `[aria-disabled="true"]` + `.is-disabled` | `disabled` prop |
| `state=error` | `.is-error` + `aria-invalid` | `error` prop |
| `state=loading` | `.is-loading` + `aria-busy` | `loading` prop |
| `size=lg` … | modifier class `.btn--lg` | `size` prop |

Two principles baked in: every state is reachable **both** via real
interaction (pseudo-classes/attributes) **and** via a forced class/prop —
the forced form is what `showcase-pages` galleries and fidelity audits
render; and state semantics ride on proper attributes (`disabled`,
`aria-invalid`, `aria-busy`), not classes alone.

### Step 3 — Generate per profile tier

- **`static-file` / `static-site`**: semantic HTML partial + one CSS file
  per component; class naming convention consistent across the DS (record
  it in AGENTS.md on first generation — BEM-ish modifiers recommended);
  zero JS unless the component is inherently behavioral (dropdown,
  dialog) — then classic-script, dependency-free, `file://`-safe.
- **`framework-app`**: component in the adopted library's framework and
  conventions (from the manifest) or the profile's chosen framework;
  variants as typed props mirroring Figma axes 1:1; styling approach
  follows the library's existing pattern, not the agent's preference.
- **`web-components`**: custom element, shadow DOM optional per project
  convention, states reflected as attributes.

Cross-tier invariants:
- **Tokens only** — every visual declaration uses `var(--token)` /
  theme references. A raw value is allowed solely where the inventory
  flagged the design itself as raw, and it must carry a
  `/* raw-by-design: <inventory ref> */` comment.
- **Accessibility floor** (profile's a11y level): keyboard operability,
  visible focus (never `outline: none` without replacement), correct
  role/name, touch targets ≥ 44px when the profile includes touch.
- Text content slots accept real content; no baked-in lorem ipsum.

### Step 4 — Self-check, document, log, update showcase

1. Render all states via forced classes in a headless browser (when
   available); compare against the Step-1 screenshots — gross mismatches
   loop back once, remaining diffs go to the report (deep checking is
   `design-fidelity-audit`'s job, and the report suggests running it).
2. Verify zero raw values (grep-level check) and zero token references
   that don't exist in `tokens/`.
3. Write `<out>/README.md`: purpose, usage snippet per tier, props/variants
   table, the state implementation table, token list consumed.
4. Update `library-manifest.json` (the component now exists at resolution
   level 2) and append the work-log entry.
5. **Regenerate `showcase/components.html`** — only when
   `target-profile.json` has `showcaseAutoUpdate: true` (set during
   `extract-design-system` pre-flight). If the flag is absent or `false`,
   skip this step silently. When enabled: if the file does not exist yet,
   create it from scratch; if it exists, regenerate it in full so the newly
   added component is included with all its states. Report only the updated
   path at the end: "↻ showcase/components.html updated."

## Hard rules

1. **All states or not done**: a generated interactive component missing
   any state present in the inventory fails its own build; states absent
   in Figma remain flagged source gaps — never invented, never blocking.
2. Tokens only; documented raw-by-design exceptions only.
3. Resolution order respected — this skill extends libraries, it never
   shadows them.
4. Dependencies generated first; a component never inlines a copy of
   another component.
5. Forced-state classes/props always provided — galleries and audits
   depend on them.

## Example invocations

- "Generate the Button component with all states"
- "/component Input"
- "Fill the DS gaps from the checkout prototype" (batch: iterate the gap
  list, dependencies first)
