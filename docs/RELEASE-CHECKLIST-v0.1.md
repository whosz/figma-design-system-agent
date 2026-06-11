# Release checklist — v0.1 (GitHub publication)

## A. Blockers — must exist before tagging v0.1

- [ ] Write `skills/extract-design-system/SKILL.md` — the foundation;
      tokens pipeline (variables → CSS + W3C JSON), component inventory
      **with all states**, "from zero" and "update/diff" modes
- [ ] Write `skills/generate-component/SKILL.md` — all states as variants/
      classes per target profile; obeys component resolution order
- [ ] Write `skills/build-rwd-prototype/SKILL.md` — breakpoints from
      profile, components-only composition, DS-gap flagging
- [ ] End-to-end smoke test on a real Figma file: pipeline
      doctor → profile → readiness → extract → validate → component →
      prototype → audit → publish, in **both** VS Code/Copilot and
      Claude Code

## B. Repository assembly

- [ ] Create the directory skeleton from AGENTS.md "Repository layout"
- [ ] Move all SKILL.md files into `skills/<name>/SKILL.md`
      (filenames here are `<name>-SKILL.md` for review convenience —
      directories are the canonical layout)
- [ ] `AGENTS.md` at repo root; `CLAUDE.md` = one line pointing to it;
      `.github/copilot-instructions.md` = same
- [ ] `.vscode/mcp.json` + `.mcp.json` with both Figma server entries
      (local commented in, remote commented out, instructions inline)
- [ ] `.github/prompts/*.prompt.md` — one thin wrapper per user-facing
      skill (skip internal-ish ones like validate-extraction if you prefer
      auto-trigger only)
- [ ] `.gitignore`: `knowledge/`, `dist/`, `reports/work-log.jsonl`
      (decide: log is personal-ish; recommend ignoring in the template,
      teams can opt in)
- [ ] Empty-dir keepers (`design-system/tokens/.gitkeep` etc.) so the
      structure survives cloning

## C. Documentation & meta

- [ ] `README.md` (done — review the quickstart against the smoke test)
- [ ] `LICENSE` (MIT)
- [ ] `CHANGELOG.md` seeded with v0.1 entry
- [ ] Verify the Mermaid graph renders on GitHub (it does in standard
      markdown preview; check subgraph syntax)
- [ ] Screenshot or GIF of the showcase gallery for the README header
      (optional but sells the project)

## D. Pre-publication review

- [ ] Re-verify current product surfaces — both change fast:
      - GitHub Copilot custom agents/prompt-file format (`.github/agents/`,
        `.prompt.md` syntax)
      - Figma MCP toolset names used across skills (`get_variable_defs`,
        `use_figma`, `get_figjam`, Code Connect tools)
      Fix any renamed tools in the skill files before tagging.
- [ ] Scrub for anything internal: no company file links, no real Figma
      URLs in examples, knowledge/ empty
- [ ] Repo settings: mark as **Template repository**, add topics
      (`figma`, `mcp`, `design-system`, `design-tokens`, `agent-skills`,
      `github-copilot`, `claude-code`)
- [ ] Tag `v0.1.0`, create the GitHub Release with the changelog entry

## E. Nice-to-have (don't block v0.1)

- [ ] Example/demo Figma community file users can duplicate to test
- [ ] GitHub Action: weekly `validate-extraction` staleness check
- [ ] `docs/` site (the showcase pages double as one for now)
