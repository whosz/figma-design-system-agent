---
name: detect-icon-library
description: >
  Detect the icon library used in the design system — either auto-discovered
  from the Figma file or from the codebase — and record it in the design
  system profile. If auto-detection fails or is ambiguous, prompts the user
  for a Figma file link, npm package name, or external library URL. Use when
  the user says "find the icon library", "what icons does the design system
  use", "set up icons", or when generate-component encounters icon components
  without a known source. Also runs automatically as part of
  figma-readiness-check when icon components are referenced.
---

# Detect Icon Library

Locates the icon library for the project and persists the result so all
generation and showcase skills can reference it consistently. Two tracks:
Figma-hosted icons (a component set or separate Figma file) and code-hosted
icons (npm package, SVG sprite, icon font).

Writes its conclusion to `design-system/icon-library.json` — the canonical
source of truth for icons in this project.

## Inputs

- Figma file URL (current target, already loaded) or a hint from the user
- `design-system/library-manifest.json` (if it exists — may already name
  an icon package)
- `target-profile.json` (to know the tech stack for code-side detection)

## Detection strategy

### Track A — Figma-hosted icons

1. `search_design_system` with queries: `icon`, `icons`, `ic_`, `Icon/`,
   `iconography`. If results exceed 20 hits of small components, treat as
   an icon set.
2. Check component-set names and page names for icon-specific naming
   (`Icons`, `Iconography`, `Icon Library`).
3. Check whether hits come from the current file or a linked library
   (external file). If external, note the library name.
4. Sample 3–5 icon components via `get_design_context`: expect single-layer
   SVG or vector group, 16×16 / 20×20 / 24×24 px, no text layers. Confirm
   the pattern; flag anomalies.

### Track B — Code-hosted icons

Scan `package.json` (if present) for known icon packages:
`@heroicons/react`, `lucide-react`, `react-icons`, `@phosphor-icons/react`,
`@tabler/icons-react`, `@mui/icons-material`, `feather-icons`, and similar.
If found, record package name + version.

### Ambiguous / not found

If neither track yields a clear result, ask the user:

> "I couldn't automatically detect an icon library in this project.
> Could you share one of the following?
> - **Figma link**: URL to the Figma file or page containing the icons
> - **npm package**: name of the icon package used in code (e.g. `lucide-react`)
> - **Other**: URL to the icon set documentation or CDN
>
> If this project doesn't use a separate icon library, reply "no icons"
> and I'll note it in the profile."

Wait for the user's reply before continuing.

## Output — `design-system/icon-library.json`

```json
{
  "detected_at": "2026-06-11T10:00:00Z",
  "source": "figma-linked-library | figma-current-file | npm | manual | none",
  "figma": {
    "library_name": "Icons — Material Design",
    "file_key": "abc123",
    "file_url": "https://figma.com/design/abc123/...",
    "component_count": 512,
    "sample_sizes": ["16", "20", "24"]
  },
  "code": {
    "package": "@heroicons/react",
    "version": "^2.1.0",
    "import_pattern": "import { ArrowRightIcon } from '@heroicons/react/24/outline'"
  },
  "notes": "External linked library — icons are not in the main design file."
}
```

Fields that don't apply are omitted. `source: "none"` means the user
confirmed no icon library exists.

## Report (in chat)

```
Icon Library detected: <name>
Source: <Figma linked library | npm package | manual>
Icons found: <count> (sizes: 16px, 24px)
Saved to: design-system/icon-library.json
```

Or if manually provided:
```
Icon Library recorded from user input: <name/url>
Saved to: design-system/icon-library.json
```

## Integration with other skills

- `extract-design-system`: after extracting components, if any have layer
  names matching icon patterns and `icon-library.json` is absent, recommend
  running this skill.
- `generate-component`: reads `icon-library.json` to choose the correct
  import pattern when a component uses icons.
- `export-ide-context`: includes the icon library name and import pattern in
  the `.designrules.md` output.
- `figma-readiness-check`: reports missing `icon-library.json` as a warning
  when icon components are present in the file.

## Hard rules

1. Never assume an icon library — if detection is ambiguous, always ask.
2. User-supplied links are recorded verbatim; never infer the file key from
   a non-Figma URL without verifying it.
3. `source: "none"` is a valid and complete result — don't re-ask on every
   run if the user already said "no icons".
4. If `icon-library.json` already exists, report the current value and ask
   whether to re-detect or update — don't silently overwrite.
5. Read-only with respect to Figma; never modifies the file.

## Example invocations

- "Detect the icon library"
- "What icons does this design system use?"
- "/detect-icon-library"
- "Set up icons before we generate components"
- "The icons aren't being picked up — run the icon detection"
