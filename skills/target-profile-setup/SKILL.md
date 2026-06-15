---
name: target-profile-setup
description: >
  Interactively establish WHAT kind of code the agent should generate and
  WHERE it must run (target stack, devices, browser support), and persist it
  as a profile all generating skills obey. Use on the first generation task
  in a repo when no profile exists, when the user asks to "change the tech
  stack", "make it work on mobile/TV/kiosk", "I just want a file I can
  double-click", or when a request conflicts with the saved profile.
---

# Target Profile Setup

One conversation, one decision record. Instead of every skill guessing the
stack and target devices, this skill asks once, writes
`design-system/target-profile.json`, and every generating skill
(`generate-component`, `build-rwd-prototype`, `docs-to-prototype`,
`publish-prototype`) reads it. Re-run any time to change course; individual
tasks may override it explicitly ("...but make this one in React").

## The two questions that matter

Ask in a single batched exchange (use the client's option/select UI when
available rather than free text):

**1. Output technology** — at minimum these tiers, simplest first:

- `static-file` — HTML + CSS + classic JS, fully functional when opened
  directly from disk (`file://`). No build step, no server, no ES modules,
  no runtime fetch. The "double-click index.html" tier — also the default
  when the user doesn't care, because it's the most shareable.
- `static-site` — modern HTML/CSS/ES modules; needs any static server
  (or the publish-prototype deploy) but still no framework/build.
- `framework-app` — React / Vue / Svelte / Angular (ask which, or read it
  from `adopt-component-repo`'s manifest — an adopted library's framework
  wins by default), with routing and a build step. For prototypes that will
  graduate into the product.
- `web-components` — framework-agnostic custom elements; for DS libraries
  meant to be consumed by multiple stacks.

**1b. CSS approach** (follow-up only when tier is `static-site` or
`framework-app`):

- `plain-css` (default) — CSS custom properties from the extracted tokens,
  one file per component.
- `tailwind` — Tailwind CSS utility classes; `extract-design-system` also
  generates a `tailwind.config.js` mapping every design token to a Tailwind
  theme key (colors, spacing, font sizes, border radius, shadows). When
  adopted, record `cssApproach: "tailwind"` in the profile and all
  generating skills emit utility classes instead of `var(--token)` calls.
- `css-modules` / `styled-components` / other — record the approach; skills
  use the library's idiom rather than plain CSS.

If the user's stack already implies an approach ("Next.js + Tailwind" →
`framework-app` + `tailwind`), infer it and confirm in one line.

**2. Target devices & constraints**

- Device classes: mobile / tablet / desktop / large-screen (TV, kiosk) —
  multi-select; maps to which DS breakpoints are mandatory
- Input model: touch / pointer / both (affects hit areas, hover usage —
  hover-only affordances are forbidden for touch targets)
- Browser floor: evergreen (default) or a named legacy constraint
- Offline requirement: none (default) / must work offline (`static-file`
  implies yes by nature)
- Accessibility target: WCAG 2.2 AA by default; ask only if the user raises
  it or the domain demands more (public sector → AA is non-negotiable;
  WCAG 2.2 adds focus appearance, target size, and accessible authentication
  criteria over 2.1 — default to 2.2 for all new projects)

If the user's original request already answers something ("client will open
it from email" → `static-file`; "this goes into our Next.js app" →
`framework-app`/React), don't re-ask — confirm the inference in one line.

## Output — the profile file

```json
{
  "version": 1,
  "decidedAt": "2026-06-11",
  "output": { "tier": "static-file", "framework": null, "cssApproach": "plain-css" },
  "devices": ["mobile", "desktop"],
  "input": "both",
  "browserFloor": "evergreen",
  "offline": true,
  "a11y": "WCAG22AA",
  "notes": "Client reviews by email; no server available."
}
```

`cssApproach` defaults to `"plain-css"`. Set to `"tailwind"` to enable
`tailwind.config.js` generation from tokens and utility-class output in all
generating skills.

Plus a short `design-system/docs/target-profile.md` explaining the choices
in plain language for teammates.

## How other skills consume it

- `generate-component`: component format and styling approach per tier
  (e.g. `static-file` → plain CSS classes; `framework-app` → the framework's
  idiom); touch targets and a11y level enforced
- `build-rwd-prototype` / `docs-to-prototype`: mandatory breakpoints =
  selected device classes; navigation = plain links (`static-*`) vs. router
  (`framework-app`)
- `publish-prototype`: `static-file` skips the bundling transformations
  (already compliant) and goes straight to verification; `framework-app`
  adds a build step before deploy
- `design-fidelity-audit`: audits only the profile's device classes by
  default

## Hard rules

1. No profile, no generation: if the file is absent, run this skill first —
   but keep it to the single batched exchange; this is a 60-second setup,
   not a questionnaire.
2. `static-file` promises are absolute: anything that breaks `file://`
   (modules, fetch, absolute paths) is a bug in that tier.
3. A user request that conflicts with the profile triggers one clarifying
   line ("profile says static-file; generate this one in React anyway, or
   update the profile?") — never a silent override in either direction.
4. Profile changes are versioned: bump `version`, keep the old file as
   `target-profile.v<n>.json`, and warn that existing prototypes were built
   against the previous profile.

## Example invocations

- "What do I need to answer before you start generating?" 
- "/target-profile" (re-run wizard)
- "Switch us to React, we're integrating with the main app"
- Auto-triggered by any generating skill when no profile exists.
