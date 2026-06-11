---
name: extract-app-flows
description: >
  Read application flow information from Figma — prototype interactions,
  flow starting points, screen connections, overlays, and FigJam flowcharts —
  and turn it into a navigable flow graph used to generate a complete,
  clickable application rather than isolated screens. Use when the user asks
  to "build the whole app from Figma", "wire up the navigation", "use the
  prototype flows", or whenever build-rwd-prototype is about to generate 3+
  screens from a file that contains prototype connections.
---

# Extract App Flows

Single screens are easy; the product lives in the connections between them.
Figma files usually already encode those connections — prototype reactions
("on click → navigate to"), flow starting points, overlay open/close, back
actions — and design teams often keep a FigJam flowchart beside the designs.
This skill extracts that information into a flow graph, which then drives
generation of a complete application with working navigation.

## Inputs

- `target`: Figma file URL (and optionally specific flow starting points)
- `sources` (optional): which signals to read — `prototype` (default),
  `figjam` (a FigJam board URL with the flow diagram), `naming`
  (fallback heuristics)
- `generate`: `graph-only` (default — extract and report) or `app`
  (extract, then drive generation of the wired application)

## Workflow

### Step 1 — Extract raw flow signals

In priority order, merging results:

1. **Prototype interactions** — for each screen frame, read the design
   context/metadata for prototype reactions: trigger (click/tap on which
   element), action (navigate / open overlay / close / back / open URL),
   destination node, and transition. Flow starting points define entry
   screens and named flows ("Onboarding", "Checkout").
2. **FigJam flowchart** (when provided) — read the board (`get_figjam`) and
   parse shapes + connectors into screen-level intent; FigJam often encodes
   *conditions* ("payment failed → error screen") that prototype noodles
   don't.
3. **Naming/structure heuristics** (fallback only) — section/page grouping
   and ordinal names ("01 Login", "02 Dashboard") imply sequence. Everything
   inferred this way is tagged `confidence: low`.

If the file has no prototype connections at all, say so plainly and offer:
proceed from FigJam/heuristics, or ask the designer to add flow starting
points and connections (one line on how).

### Step 2 — Build the flow graph

Normalize into `flows/<flow-name>.flow.json`:

```json
{
  "name": "checkout",
  "entry": "cart",
  "nodes": [
    { "id": "cart", "figmaNode": "1:23", "title": "Cart" },
    { "id": "payment", "figmaNode": "1:45", "title": "Payment" }
  ],
  "edges": [
    { "from": "cart", "trigger": "click #checkout-btn",
      "action": "navigate", "to": "payment", "confidence": "high" },
    { "from": "payment", "trigger": "condition: payment failed",
      "action": "navigate", "to": "payment-error", "confidence": "medium",
      "source": "figjam" }
  ]
}
```

Also emit a Mermaid diagram per flow into `flows/docs/` so humans can review
the graph at a glance before any generation happens.

**Graph health checks** (always reported):
- unreachable screens (designed but never linked)
- dead ends (no exit and not plausibly terminal)
- triggers pointing at elements that don't exist on the screen
- conflicting edges (same trigger, two destinations)

### Step 3 — Generate the application (`generate: app`)

Hand the graph plus screens to the generation pipeline, honoring
`target-profile.json`:

- `static-file` / `static-site` tier → one HTML page per node; edges become
  real `<a href>` / button handlers; overlays become in-page dialogs;
  "back" uses history. The result is a fully clickable app from disk.
- `framework-app` tier → routes from nodes (router config generated),
  navigation calls from edges, overlay actions as modal state; conditional
  FigJam edges become stub branch points with `// TODO: condition from flow`
  markers — the agent wires navigation, it does not invent business logic.
- Screens themselves are produced by `build-rwd-prototype` /
  `generate-component` under their own rules; this skill contributes only
  the wiring and the app shell.

After generation, walk every `confidence: high` edge in a headless browser
(click the trigger, assert the destination) and report the traversal table.

### Step 4 — Report

Flows found (names, screen counts), graph health findings, confidence
breakdown, traversal results, and the artifacts: flow JSONs, Mermaid docs,
and the app entry point. Suggest `design-fidelity-audit` per screen and
`publish-prototype` for the wired app as natural next steps.

## Hard rules

1. The flow graph is reviewable *before* generation — `graph-only` first on
   new files; never silently generate a 20-screen app from an unverified
   graph.
2. Low-confidence (heuristic) edges never silently shape the app: include
   them in the graph, exclude them from generation unless the user approves
   the list.
3. Navigation is generated; business logic is not — conditions become
   labeled stubs, never invented rules.
4. Re-extraction is non-destructive: a changed graph produces a diff report
   against the previous `flow.json` before overwriting it.

## Example invocations

- "Read the flows from our Figma prototype and build the whole onboarding
  app"
- "/flows extract https://figma.com/design/abc… graph-only"
- "The flow diagram is in this FigJam — use it to wire the screens together"
