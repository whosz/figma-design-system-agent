---
name: mcp-doctor
description: >
  Diagnose and smoke-test MCP server connections used by this agent (Figma MCP
  and any others configured). Use this skill whenever a Figma/MCP tool call
  fails, returns auth errors or empty results, when the user says "MCP doesn't
  work", "can't connect to Figma", "test the connection", or at the start of a
  session before long multi-step workflows to fail fast instead of mid-task.
---

# MCP Doctor — Connection Tester

Verifies that the MCP servers this agent depends on are reachable,
authenticated, and actually functional — then reports a clear status matrix
with fixes. Run it proactively before long pipelines; a 30-second check beats
failing on step 7 of an extraction.

## Workflow

### Step 1 — Inventory expected servers

Read the repo's MCP configuration files and build the expected list:
- `.vscode/mcp.json` (VS Code / GitHub Copilot)
- `.mcp.json` (Claude Code)
- any servers already visible in the current session's tool list

The primary dependency is the **Figma MCP server** (local Dev Mode at
`http://127.0.0.1:3845/mcp` or remote `https://mcp.figma.com/mcp`).

### Step 2 — Run the test ladder per server

Run tests in order; stop at the first failure and diagnose it — later levels
are meaningless if an earlier one fails.

**Level 1 — Tools visible.** Are the server's tools present in the current
session? If not: server not started, not configured for this client, or the
client needs a restart after config changes.

**Level 2 — Auth valid.** Call the cheapest identity/read tool
(for Figma: `whoami`). Auth errors → user must re-authenticate (OAuth flow
for remote; for local Dev Mode, the desktop app must be running, logged in,
and the MCP server enabled in Figma → Preferences).

**Level 3 — Read works.** Call a real read against a known target
(`get_variable_defs` or `get_metadata` on a file the user provides, or the
current selection for the local server). Empty-but-successful responses are a
*pass* for connectivity — note them, since they may matter to the
readiness-check skill instead.

**Level 4 — Write works** (only if the planned workflow needs it, e.g.
`code-to-figma`). Do **not** create test garbage in the user's design file:
verify write capability by checking that write tools (`use_figma`,
`upload_assets`) are exposed and that the authenticated user has edit access
to the target file (from Level 3 metadata). Only perform an actual test write
if the user explicitly agrees, and into a new file via `create_new_file`.

### Step 3 — Report

```
# MCP Status — <date, time>

| Server     | Configured | Tools visible | Auth | Read | Write-capable |
|------------|-----------|---------------|------|------|----------------|
| Figma (local)  | yes   | yes           | OK   | OK   | yes            |
| Figma (remote) | yes   | no            | —    | —    | —              |

## Issues & fixes
1. Figma remote: tools not visible in this client.
   Fix: check `.vscode/mcp.json` entry, then restart the MCP client. …
```

Every failed cell gets a numbered issue with a concrete, client-specific fix
(VS Code/Copilot vs. Claude Code instructions differ — give the one matching
the current environment, mention the other briefly).

## Common failure dictionary

- **Local server unreachable** → Figma desktop app not running, or Dev Mode
  MCP server not enabled in preferences, or wrong port in config.
- **401/403 on remote** → expired OAuth; re-run the client's auth flow.
- **Tools visible but every call times out** → corporate proxy/firewall;
  check network allowlist for `mcp.figma.com`.
- **`get_variable_defs` returns empty on a known-good file** → wrong file
  key in URL, or the user lacks access to that file (shared-library files
  need explicit access).
- **Worked yesterday, broken today** → client cached a stale tool list;
  restart the editor/CLI before deeper debugging.

## Hard rules

1. Never perform writes during diagnostics without explicit user consent.
2. Never ask the user for tokens/credentials in chat; point them to the
   client's own auth flow.
3. Always finish with the status table, even when everything passes — "all
   green" is a useful answer.

## Example invocations

- "Test the MCP connections"
- "Figma tools keep failing, diagnose it"
- Run automatically as step 0 of long pipelines when the previous session
  ended with MCP errors.
