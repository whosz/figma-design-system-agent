---
name: design-fidelity-audit
description: >
  Verify that a generated component, screen, or prototype faithfully matches
  its source design in Figma, and produce a structured discrepancy report.
  Use after generate-component, build-rwd-prototype, or code-to-figma runs,
  whenever the user asks "does this match the design", "check against Figma",
  "QA the prototype", or before publishing/sharing a prototype with
  stakeholders.
---

# Design Fidelity Audit

Compares an implementation (component or full screen, at one or more
breakpoints) against its Figma source and reports differences with severity
levels. This is the quality gate of the agent: other skills generate, this
one judges. It is read-only — it proposes fixes but applies none unless the
user asks.

## Inputs

- `implementation`: path to the component/prototype (or a generated Figma
  frame, when auditing the code→Figma direction)
- `design`: Figma node link for the source of truth
- `breakpoints` (optional): which to audit; default — all defined in the DS
- `threshold` (optional): `strict` | `normal` (default) | `relaxed`

## Workflow

### Step 1 — Capture both sides

- **Figma side**: `get_screenshot` of the source node (per breakpoint frame
  when they exist) + `get_design_context` and `get_variable_defs` for the
  structured truth: spacing, typography, colors as token references.
- **Code side**: render the implementation in a headless browser at each
  breakpoint's viewport; capture screenshot + computed styles of key elements
  (the DOM is the structured truth here).

If headless rendering is unavailable in the environment, degrade gracefully:
run the structural checks (Step 2, items 1–4) from source code analysis and
state clearly that pixel comparison was skipped.

### Step 2 — Structured comparison (primary)

Compare structured data first — screenshots second. Pixel-diffing alone
produces noise; token-level comparison produces actionable findings.

1. **Token usage**: every color/spacing/font/radius in the implementation
   resolves to the same token the Figma node references. A correct *value*
   via a wrong *token* (or hardcoded) is still a finding — it will drift.
2. **Typography**: family, size, weight, line-height, letter-spacing per
   text role.
3. **Spacing rhythm**: paddings/gaps of layout containers vs. auto layout
   values.
4. **Structure & content**: element order, missing/extra elements, text
   content mismatches, missing states (hover/focus/disabled present in Figma
   variants but absent in code).
5. **Visual diff** (when screenshots exist): overlay comparison per
   breakpoint. Ignore anti-aliasing and font-rendering noise; flag layout
   shifts, wrong colors visible at a glance, broken images.
6. **Responsive behavior**: between breakpoints, does the implementation
   reflow the way the per-breakpoint Figma frames imply? Where Figma has only
   one breakpoint, mark responsive findings as *assumption-based*.

### Step 3 — Classify findings

- **Critical** — wrong component used, missing element/state, wrong token
  category (e.g. secondary color where primary belongs), broken layout at
  any breakpoint.
- **Major** — hardcoded value instead of a token, spacing off by more than
  one step of the spacing scale, wrong type role.
- **Minor** — sub-step spacing differences, rendering-engine artifacts,
  content placeholder mismatches.

`threshold` controls the verdict line: `strict` fails on Major+,
`normal` fails on Critical, `relaxed` only reports.

### Step 4 — Report

Save to `reports/fidelity/<name>-<date>.md` and summarize in chat:

```
# Fidelity Audit — checkout / mobile-375 + desktop-1440

Verdict: FAIL (2 critical, 3 major, 5 minor)

## Critical
1. [mobile] "Apply coupon" field present in Figma, missing in implementation.
   Fix: add <CouponInput> from design-system/components/coupon-input.
...
```

Every finding: breakpoint, what Figma says, what the implementation does,
and a one-line suggested fix referencing the DS component/token when
possible. Offer (don't perform) the next step: "want me to apply the
critical and major fixes?"

## Hard rules

1. Structured comparison before pixels; never report from screenshots alone
   when design context is available.
2. Read-only: fixes are applied only on explicit request, by handing off to
   the generating skill.
3. Findings reference tokens and components by name — "padding should be
   `space/300` (24px), is 16px", not "padding looks too small".
4. Always state what could NOT be checked (skipped breakpoints, no headless
   browser, single-breakpoint designs).

## Example invocations

- "Audit the checkout prototype against the Figma design"
- "/fidelity components/button https://figma.com/design/abc?node-id=1-23"
- Automatically suggested as a final step by build-rwd-prototype and
  code-to-figma.
