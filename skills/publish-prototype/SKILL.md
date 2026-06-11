---
name: publish-prototype
description: >
  Package a prototype as a self-contained, serverless HTML+CSS bundle that
  opens directly from disk (double-click index.html), and optionally deploy it
  online (GitHub Pages, Netlify, Vercel, Cloudflare Pages). Use whenever the
  user wants to share a prototype, "send it to a client", "make it work
  without a server", export a static version, put a prototype online, or get
  a public link to show stakeholders.
---

# Publish Prototype

Turns a prototype from `prototypes/` into something shareable in two tiers:

- **Tier 1 — serverless bundle**: a folder (and zip) that works offline via
  `file://`. Anyone can double-click `index.html`. No Node, no server, no
  instructions needed.
- **Tier 2 — online deploy** (optional): the same bundle published to a
  static host with a public URL.

Always produce Tier 1. Ask about Tier 2 only if the user hasn't already
specified it.

## Inputs

- `source`: prototype path (file or directory in `prototypes/`)
- `target` (optional): `local` (default), `github-pages`, `netlify`,
  `vercel`, `cloudflare-pages`
- `out` (optional): output directory, default `dist/<prototype-name>/`

## Workflow

### Step 1 — Build the serverless bundle

The `file://` protocol is unforgiving; the bundle must respect its limits:

- **No ES modules, no fetch/XHR.** `<script type="module">` and runtime
  `fetch()` of local files fail under `file://` due to CORS. Bundle all JS
  into classic `<script>` tags (inline or single file); inline any data the
  prototype loads at runtime (JSON → embedded `<script>` data block).
- **Relative paths only.** No leading-slash absolute paths, no hardcoded
  `localhost`. Verify every `href`/`src`.
- **Design system inlined or copied.** Copy `design-system/tokens/*.css` and
  used component styles into the bundle (e.g. `assets/css/`); the bundle must
  not reference files outside its own folder.
- **Assets local.** Download-time dependencies (fonts, icons from CDNs) get
  copied in, with licenses respected; system-font fallbacks declared.
- **Multi-page prototypes** get a generated `index.html` hub linking all
  screens/breakpoint variants if one doesn't exist.

Then zip the folder: `dist/<prototype-name>.zip`.

### Step 2 — Verify the bundle

1. Open `index.html` via `file://` in a headless browser; capture console —
   any CORS/404 error fails the build and loops back to Step 1.
2. Screenshot at the project's defined breakpoints; eyeball for obviously
   broken layout (this is a smoke test — full fidelity checking belongs to
   the `design-fidelity-audit` skill).
3. Report bundle size; warn above ~25 MB (email/Slack attachment limits).

### Step 3 — Online deploy (only when requested)

Confirm with the user before anything goes public: the deployed prototype
will be **publicly accessible** unless the host's access controls are
configured. State this plainly.

- **`github-pages`** (default suggestion — the repo already lives on GitHub):
  publish `dist/` via a `gh-pages` branch or an Actions workflow; if a
  workflow doesn't exist, generate
  `.github/workflows/deploy-prototype.yml` and explain that the user must
  enable Pages in repo settings. URL: `https://<user>.github.io/<repo>/…`.
- **`netlify` / `vercel` / `cloudflare-pages`**: use the respective CLI if
  installed and authenticated; never ask for tokens in chat — if auth is
  missing, print the official login command and stop.

Note for stakeholder-sharing scenarios: GitHub Pages on public repos means a
public prototype; if the design is confidential, recommend Netlify/Vercel
password protection or a private-repo Pages setup instead.

### Step 4 — Hand-off message

End with: bundle path + zip path, "how to open" one-liner for non-technical
recipients, public URL (if deployed), bundle size, and anything inlined or
substituted (fonts, data) the user should know about.

## Hard rules

1. Tier 1 must pass the `file://` headless check before being handed over.
2. Nothing is deployed publicly without explicit confirmation in this
   conversation.
3. No credentials in chat or in committed files; deploy auth happens via the
   host's CLI/flow.
4. The bundle is a copy — publishing never mutates `prototypes/` or
   `design-system/`.

## Example invocations

- "Package the checkout prototype so the client can open it without a server"
- "/publish prototypes/dashboard → github-pages"
- "Zip the onboarding prototype for email"
