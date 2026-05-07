---
name: ck:orchestrator
description: ForgeKit router for non-technical :ck:auto workflows. Chooses minimum skills/tools after Spec approval.
metadata:
  author: forgekit
  version: "2.0.0"
---

# Orchestrator

Purpose: route each approved `:ck:auto` task to the smallest useful skill/tool set.

## Priority

1. ForgeCode native tools first: `fs_search`, `read`, `patch`, `write`, `shell`, `task`, `todo_write`.
2. Load one primary skill only.
3. Add secondary skill only after concrete need.
4. Verify before final report.

## Routing Table

| Intent | Primary | Secondary / Tool |
|---|---|---|
| bug, error, failing test, type/lint issue | `fix` | `ck-debug`, `test` |
| unclear root cause | `ck-debug` | `test` |
| new web/frontend feature | `frontend-development` | `web-frameworks`, `ui-ux-pro-max` if visual |
| backend/API/auth/service | `backend-development` | `databases`, `security-scan` |
| Next.js/React framework work | `web-frameworks` | `frontend-development` |
| database/schema/query/migration | `databases` | `backend-development` |
| UI/page/component/design/review | `ui-ux-pro-max` | none initially |
| security/secrets/audit | `security-scan` | `backend-development` if code changes |
| docs/API docs/readme | `docs` | none initially |
| deploy/publish/hosting | `deploy` | `security-scan` before production |
| commit/push/PR | `git` | `code-review` before commit |
| large repo/refactor/symbol/find references | native search first, then Serena MCP | `scout` only if Serena unavailable |
| noisy shell/test/build/log/diff | RTK if installed | native shell fallback |

## Serena MCP Use

Use Serena when any condition holds:

- repo is large or unfamiliar
- task asks refactor/rename/find usages
- symbol-level context needed
- cross-file impact unclear

Do not use Serena for 1-file obvious edits.

## RTK Use

Use RTK for long/noisy shell outputs:

- test/build logs
- git diff/status with many files
- CI logs
- package manager output

Do not use RTK for file edits.

## Forbidden

- Do not use context-mode in this kit.
- Do not load broad design/media/AI skills by default.
- Do not read whole repositories or full reference directories.
- Do not ask user to choose a skill.
