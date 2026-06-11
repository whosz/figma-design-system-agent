---
name: design-system-search
description: >
  Semantically search and query the extracted design system — tokens,
  components, states, and variants — using natural-language questions.
  No external vector database required; works directly over the JSON
  artifacts. Use when the user asks "what color is used for error states",
  "find all components with a disabled variant", "are there raw values
  instead of tokens", "show me all spacing tokens", or any exploratory
  query over the design system. Also useful for quick audits before
  generation.
---

# Design System Search

Answers natural-language queries against the extracted design system
without requiring a live Figma connection or an external vector database.
The LLM reasons directly over `tokens.json` and `inventory.json`; results
are returned as tables or lists with source references.

Inspired by FigmaAiAgent's RAG-over-design-documentation pattern, simplified
to work in-process without infrastructure.

## Inputs

- Query: the user's natural-language question (required)
- `design-system/tokens/tokens.json` — W3C token definitions
- `design-system/inventory.json` — component inventory
- `design-system/docs/inventory.md` (optional, for richer context)

**Pre-flight:** If `inventory.json` or `tokens.json` is missing, stop and say
"Run `extract-design-system` first — no design system data found."

## Query types and response format

### Token queries
*"what colors are used for error states"*, *"show all spacing tokens"*,
*"which tokens have a dark-mode variant"*

→ Return a filtered table from `tokens.json`:

| Token | Value (light) | Value (dark) | Used by |
|---|---|---|---|

### Component queries
*"find all components with a disabled state"*, *"which components have an
error variant"*, *"list all button variants"*

→ Return a filtered table from `inventory.json`:

| Component | Variants | States | Key |
|---|---|---|---|

### Audit queries
*"are there raw values instead of tokens"*, *"which components are missing
hover state"*, *"unused tokens"*

→ Return a finding list with severity (warning / info) and fix suggestion:

| Finding | Location | Severity | Fix |
|---|---|---|---|

### Free-form queries
*"what is the primary action color"*, *"how is elevation expressed in this
design system"*

→ Paragraph answer with token/component citations in the format
`[token: --color-primary-600]` or `[component: Button]`.

## Steps

1. Classify the query into one of the four types above (token / component /
   audit / free-form). When the query spans types, answer each part in order.
2. Load the relevant artifact(s):
   - Token queries → `tokens.json`
   - Component queries → `inventory.json`
   - Audit queries → both
   - Free-form → both
3. Filter / scan the data for matches. For semantic matching (e.g. "error
   colors"), look for: token name contains `error|danger|destructive|negative`,
   OR component state named `error|invalid`, OR token used by a component state
   named `error`. Document the matching logic briefly in the response.
4. Return the result in the appropriate format above. Always cite the artifact
   and key so the user can verify: `tokens.json > color/feedback/error/600` or
   `inventory.json > Button > states.error`.
5. If zero results: say "No matches found" and suggest a broader query or
   confirm that the design system was fully extracted (offer to run
   `validate-extraction`).
6. No work-log entry — search is read-only (AGENTS.md rule 6 analogy).

## Hard rules

1. Read-only. Never modify tokens, inventory, or any artifact.
2. Cite sources for every result — token path or component/state path.
3. Semantic matching logic is shown, not hidden. If a query is ambiguous
   (e.g. "primary" matches 12 tokens), say so and list them all rather
   than picking one silently.
4. Stale data caveat: if artifact timestamps are > 7 days old, note it
   once at the top of the response.

## Example invocations

- "What colors are used for error and warning states?"
- "Find all components that have a loading state"
- "Are there any hardcoded values instead of tokens in the components?"
- "Show me all typography tokens"
- "/design-system-search which components support dark mode?"
- "What is the border radius used for cards?"
