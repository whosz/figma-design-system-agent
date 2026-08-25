---
name: docs-to-prototype
description: >
  Generate screens, flows, and prototypes from the existing design system
  based on written or visual documentation: Miro board exports, workshop
  summaries, meeting notes, user-story lists, or requirement docs — i.e. when
  there is NO Figma design yet, only described intent. Use when the user
  pastes notes and says "build this", "turn these workshop findings into a
  prototype", "we sketched this in Miro", or provides requirements without a
  design link.
---

# Docs → Prototype (design-system-driven generation)

Builds prototypes when the input is *intent*, not *design*: a Miro board, a
workshop summary, meeting notes, or a requirements doc. The design system is
the visual source of truth; the document is the functional source of truth.
The skill's core discipline is keeping those two roles separate and labeling
every gap it had to fill with judgment.

## Inputs

- `source`: one or more of —
  - pasted text (summary, notes, user stories)
  - exported files (Miro board export PDF/image/CSV, docx/pdf of minutes)
  - a Miro board link **only if** a Miro MCP/connector is available in the
    session; otherwise ask the user for an export (never scrape)
- `fidelity` (optional): `wireflow` (screens + navigation, placeholder
  content) or `hi-fi` (default — full DS styling, realistic content)
- `out` (optional): default `prototypes/<slug-from-doc-title>/`

## Workflow

### Step 1 — Extract a requirements model from the document

Parse the source into a structured brief (save as `out/brief.md` — this is
the audit trail between messy notes and generated screens):

- **Screens/views** mentioned or implied, with their purpose
- **User flows**: sequences and decision points (Miro arrows, "then the user…"
  phrasing, numbered steps)
- **Content & data**: fields, labels, copy fragments quoted from the doc
- **Functional requirements**: actions, validations, states
- **Open questions**: everything the document does not answer

Mark each item with its evidence: `[doc]` (stated explicitly), `[implied]`
(reasonable inference), `[assumed]` (the skill's own judgment). This marking
is mandatory and survives into the final report.

### Step 2 — Clarify or declare

If `[assumed]` items would materially change the prototype (target device,
audience, critical flow ambiguity), ask the user **once**, batching all
questions. Otherwise proceed and keep assumptions visible. Never stall a
generation on cosmetic unknowns.

### Step 3 — Map requirements to the design system

For every screen element in the brief, resolve against
`design-system/components/`:

- Match found → use it; never restyle or fork it.
- No match → do **not** invent a new permanent component. Build the element
  inline within the prototype, mark it `data-ds-gap="<name>"` in the markup,
  and add it to the *DS gap list* — the user decides later whether to promote
  gaps into real components via `generate-component`.
- No design system at all yet for this project → that's AGENTS.md's
  page-craft-layer rule (global rule 13): check for the `interface-design`
  skill/plugin before inventing layout/hierarchy decisions from scratch.

Tokens-only styling applies exactly as in `build-rwd-prototype` (this skill
delegates layout/breakpoint mechanics to that skill's rules rather than
duplicating them).

### Step 4 — Generate

- One HTML file per screen + an `index.html` flow hub that mirrors the user
  flows from the brief (clickable navigation following the documented paths).
- Realistic content drawn from the document's own vocabulary and copy; where
  the doc gives none, generate domain-appropriate placeholders and mark them
  `[assumed]` in the brief.
- All breakpoints defined in the DS, unless the doc constrains the target
  ("mobile app onboarding" → mobile-first, desktop optional).

### Step 5 — Report

- Link to the prototype and `brief.md`
- **Coverage table**: each documented requirement → screen/element that
  implements it, or "not covered + why"
- **DS gap list**: components that didn't exist, with a one-line spec each
- **Assumption list**: every `[assumed]` decision, so a workshop facilitator
  can validate them with stakeholders
- Suggested next steps: `design-fidelity-audit` is *not applicable* (no
  Figma source); instead suggest `code-to-figma` to turn the validated
  prototype into Figma designs, closing the loop.

## Hard rules

1. The design system constrains visuals; the document constrains scope.
   Never let the doc's sketch aesthetics override DS tokens, and never let
   the DS's available components silently shrink the documented scope.
2. Every inference is labeled `[implied]` or `[assumed]` — traceability over
   confidence.
3. DS gaps are flagged, not silently solved with permanent new components.
4. No scraping of Miro links without a proper connector; ask for an export.
5. Quoted copy from the doc is used verbatim where given (it's often the
   product of a workshop agreement — don't "improve" it).

## Example invocations

- "Here are the notes from yesterday's workshop — build a prototype of the
  onboarding flow" (+ pasted text)
- "/docs-to-prototype miro-export.pdf fidelity=wireflow"
- "Turn these five user stories into clickable screens using our DS"
