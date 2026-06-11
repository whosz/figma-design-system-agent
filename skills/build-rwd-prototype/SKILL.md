---
name: build-rwd-prototype
description: >
  Build a responsive (RWD) prototype of one or more screens from the Figma
  designs, composed exclusively from design-system components and tokens,
  across all breakpoints required by the target profile. Use when the user
  asks to "build/prototype the <screen>", "make this design work in the
  browser", "responsive version of <frame link>", or as the generation step
  of the flow pipeline (extract-app-flows) and docs-to-prototype.
---

# Build RWD Prototype

Composes screens out of the design system. The component skills make the
LEGO bricks; this skill builds the model — and is forbidden from carving
new bricks on the side: anything missing becomes a flagged DS gap, not an
ad-hoc invention.

## Gates

1. `target-profile.json` exists (else `target-profile-setup` first).
2. Tokens exist in `design-system/tokens/` (else `extract-design-system`
   first).
3. Source: a Figma screen node link (default path), or a flow graph +
   brief when called by `extract-app-flows` / `docs-to-prototype` (those
   skills own their own source rules; this one then only composes).

## Inputs

- `screens`: one or more Figma frame links (or node ids)
- `breakpoints` (optional): default = device classes from the target
  profile mapped to the DS breakpoint scale
- `out` (optional): default `prototypes/<screen-slug>/`

## Workflow

### Step 1 — Read the design per breakpoint

For each screen, find its per-breakpoint frames in Figma (naming/section
conventions, or the user's explicit links). Fetch `get_design_context` +
`get_screenshot` per frame.

**The single-breakpoint case is the important one.** When Figma has only
(say) desktop, the agent must *derive* mobile behavior — that derivation
is allowed but every derived decision is labeled `[assumed]` in the
prototype's `NOTES.md` (stacking order, what collapses into menus, image
crops). Assumed responsive behavior is a first-class report item, because
it's exactly what the designer needs to review.

### Step 2 — Decompose into components

Walk the design context and match every element against the resolution
order (library manifest → generated components → nothing):

- **Match** → use the component, selecting the variant/state matching the
  design (a button drawn in its disabled style instantiates
  `state=disabled`, not a restyled default).
- **No match** → inline minimal markup tagged `data-ds-gap="<name>"`,
  added to the DS gap list. After composition, offer to batch-run
  `generate-component` on the gap list and re-compose.
- Repeated regions (cards in a grid) become loops over one component +
  content data, not copy-paste.

Real content comes from the Figma frames (per AGENTS.md honesty rules);
where frames hold placeholder lorem, keep it and flag it.

### Step 3 — Layout & responsiveness

- Page-level layout from the per-breakpoint frames: CSS grid/flex mirroring
  the auto-layout structure; spacing exclusively via spacing tokens.
- **Mobile-first media queries** on the DS breakpoint scale; component-
  internal responsiveness via container queries where the profile's
  browser floor allows (evergreen: yes), else media queries.
- Between defined breakpoints, behavior is fluid (relative units,
  `clamp()` on type scale if the DS defines one) — never hard jumps that
  invent intermediate designs.
- Touch profile: hover-only affordances forbidden; interactive spacing
  respects target sizes.
- Navigation: plain anchors between screens for `static-*` tiers, router
  stubs for `framework-app`; real flow wiring belongs to
  `extract-app-flows` — if a flow graph exists for these screens, consume
  its edges instead of guessing links.

### Step 4 — Verify, package, log

1. Headless render at every breakpoint: console clean, no horizontal
   overflow at the narrowest width, no zero-height collapsed sections,
   images loading.
2. Quick structural pass vs. the Figma screenshots (gross errors only —
   then point to `design-fidelity-audit` for the real verdict and offer to
   run it).
3. Write `prototypes/<slug>/`: screens, `NOTES.md` (assumptions, DS gaps,
   content flags), `index.html` hub when multi-screen.
4. Work-log entry; closing report: screens × breakpoints delivered, DS
   gap list, `[assumed]` list, suggested next steps (`design-fidelity-
   audit`, `publish-prototype`).

## Hard rules

1. Components and tokens only — no ad-hoc styled markup except flagged
   `data-ds-gap` placeholders awaiting `generate-component`.
2. Every responsive decision not present in Figma is `[assumed]` and
   surfaced; single-breakpoint sources never yield silently invented
   designs.
3. Prototypes consume the DS, never mutate it — no token edits, no
   component edits from inside a prototype task.
4. Each required breakpoint is built and verified; "desktop works, mobile
   probably fine" is a failed task.
5. States in context: interactive elements in the prototype keep their full
   state behavior (they're DS components, so this comes free — bypassing
   components forfeits it, which is reason enough for rule 1).

## Example invocations

- "Build a responsive prototype of the checkout screen: <link>"
- "/prototype <frame-link> breakpoints=mobile,desktop"
- "Make the dashboard design work in the browser, tablet included"
