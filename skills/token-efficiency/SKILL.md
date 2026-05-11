---
name: ck:token-efficiency
description: "Token budget rules for workflows"
auto_load: false
triggers:
  - token budget
  - context budget
  - minimal reads
  - token policy
non_triggers:
  - code implementation
  - file editing
  - testing
examples:
  - "quản lý token budget khi task lớn"
  - "đọc codebase sao cho tiết kiệm token"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Token Efficiency

Goal: preserve skill quality while minimizing default context.

## Load Policy

- `SKILL.md` is the thin entry.
- `references/` holds depth.
- Read references only when the task specifically needs them.
- Never load an entire skill directory.
- Start with max 1 primary skill.
- Add secondary skill only after a blocker or concrete requirement appears.
- **Do NOT auto-load skills** — use `scripts/route-intent.cjs` routing hint to determine which skill to load.
- **Skill description must be ≤80 chars** — long descriptions with trigger keywords cause unwanted auto-load.
- All non-entry skills have `auto_load: false` — they load on-demand only when the runtime router says so.

## Codebase Policy

1. Start with targeted `fs_search` for filenames, symbols, scripts, errors.
2. Read only relevant files and line ranges.
3. Use Serena MCP for large codebases, symbol lookup, references, safe refactors.
4. Use `scout` only when targeted search and Serena are insufficient/unavailable.
5. Summarize findings before expanding scope.

## Shell Policy

- Use ForgeCode shell only for real commands.
- Use RTK when shell output may be long.
- Prefer commands that naturally produce concise output.
- Do not pipe through grep/find/cat/head/tail when native tools exist.

## Output Policy

- Vietnamese concise by default.
- No fluff, no repeated caveats.
- Preserve exact code, paths, commands, test names.
- Non-tech reports explain outcome, verification, and next action only.

## Context Budget Escalation

Escalate context only in this order:

1. exact file/symbol search
2. narrow file read
3. package/framework docs/scripts
4. primary skill `SKILL.md`
5. selected reference file
6. Serena MCP or scout
7. secondary skill

## Disabled

- context-mode: disabled by product decision.
- cavemem: disabled by product decision.
