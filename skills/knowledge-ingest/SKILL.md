---
name: knowledge-ingest
description: >
  Connect to and ingest project documentation from external sources —
  SharePoint folders, Confluence spaces, Google Drive, Notion, Miro, OneDrive,
  or plain local folders — and normalize it into a local knowledge cache with
  provenance, ready for docs-to-prototype and other skills. Use whenever the
  user references documents living "in SharePoint / on the drive / in
  Confluence / on our wiki", shares a link to such a source, or asks the
  agent to base its work on existing project documentation.
---

# Knowledge Ingest — external documentation sources

`docs-to-prototype` and friends need *content*; this skill is the supply
line. It discovers which document sources are reachable in the current
session, fetches the requested material, and normalizes everything into
`knowledge/` — a local, provenance-tagged cache that downstream skills read
instead of each inventing its own SharePoint handling.

## Supported source types

| Source            | Access path                                          |
|-------------------|------------------------------------------------------|
| SharePoint / OneDrive | Microsoft 365 / SharePoint MCP connector (Graph) |
| Confluence        | Atlassian MCP connector                              |
| Google Drive/Docs | Google Drive MCP connector                           |
| Notion            | Notion MCP connector                                 |
| Miro              | Miro MCP connector                                   |
| Local folder      | direct filesystem read                               |
| Manual export     | user-uploaded files (pdf, docx, xlsx, pptx, md, csv) |

The table is open-ended: any document-capable MCP connector the session
exposes qualifies. **Manual export is the universal fallback** — when no
connector exists for a source, ask the user for an export instead of
attempting to scrape links or simulate access.

## Workflow

### Step 1 — Discover available connectors

Inspect the session's tool list for document-source connectors. Report what
is and isn't connected relative to what the user mentioned ("you referenced
a SharePoint folder, but no Microsoft connector is active in this session —
connect one, or export the folder and upload it"). Never imply access the
session doesn't have.

### Step 2 — Scope before fetching

A "folder" can be three files or three thousand. Before bulk-fetching:
list the source first (names, types, dates, sizes), present the listing, and
confirm scope — by subfolder, file pattern, date range, or explicit
selection. Default proposal: documents modified in the last 12 months,
relevant formats only (docs, slides, sheets, PDFs, board exports).

### Step 3 — Fetch and normalize

For each ingested document, write into the cache:

```
knowledge/
├── index.json                 # the catalog downstream skills query
└── <source>/<doc-slug>/
    ├── content.md             # extracted text, normalized to markdown
    ├── original.<ext>         # raw copy when size-reasonable
    └── meta.json              # provenance (see below)
```

`meta.json` provenance is mandatory: source system, original URL/path,
title, author if available, last-modified date, fetch date, and access note
(who could see this — see privacy rules). Extraction notes record anything
lossy (tables flattened, images skipped, OCR used).

### Step 4 — Catalog and hand off

Update `knowledge/index.json` (id, title, source, dates, topics, one-line
summary per doc). Then report: what was ingested, what was skipped and why,
which documents look most relevant to the user's stated goal, and the ready
next step — e.g. "run docs-to-prototype against knowledge/sharepoint/
onboarding-workshop/".

### Refresh mode

`/knowledge refresh` re-checks last-modified dates of cataloged sources and
re-fetches only changed documents, reporting the diff. Downstream skills
should warn when working from documents older than their source.

## Hard rules

1. **Read-only everywhere.** This skill never writes to, moves, or reshapes
   anything in the source systems.
2. **No credentials in chat.** Authentication happens through each
   connector's own flow; if auth fails, hand off to `mcp-doctor`.
3. **Respect access as configured.** Use only the access the connector
   grants; never ask the user to widen permissions "to make ingestion
   easier".
4. **Privacy floor.** Ingest project documentation, not people: skip
   obviously personal/HR/financial files even when present in scope, and
   flag them instead. The cache lands in the repo's gitignored area by
   default (`knowledge/` in `.gitignore`) — internal docs must not leak into
   a public template repo; the user must explicitly opt in to committing
   any of it.
5. **Provenance always.** A document without `meta.json` doesn't exist for
   downstream skills.

## Example invocations

- "The workshop materials are in our SharePoint folder 'UX/Discovery' —
  pull them in and build the prototype brief from them"
- "/knowledge ingest confluence space=DESIGN"
- "Refresh the knowledge cache before we regenerate the flows"
