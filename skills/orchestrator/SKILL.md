---
name: ck:orchestrator
description: "Internal skill routing after Spec approval"
auto_load: false
metadata:
  author: forgekit
  version: "2.0.0"
---

# Orchestrator

Purpose: route each approved `:ck:auto` task to the smallest useful skill/tool set.

Before routing, read `skills/registry.md` and choose the single best matching primary skill.

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
| privacy/notifications/session hooks | hooks-runtime | hooks/<type>/HOOK.md |
| large repo/refactor/symbol/find references | `context-engineering` | Serena MCP nếu có, `scout` nếu không |
| repo skeleton/orient unfamiliar codebase | `repo-map` | `context-engineering` if specific symbol needed |
| fix/refactor only changed files | `diff-context` | `fix` or `ck-debug` as primary |
| codebase summary without Serena | `code-map` | `repomix` for full summary |
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

## Confidence Gate

Khi routing, luôn tính confidence score cho mỗi skill match (xem `references/intent-classifier.md` cho chi tiết scoring).

### Quy tắc routing dựa trên confidence gap

1. **Gap ≥ 0.15** giữa skill #1 và skill #2 → route trực tiếp skill #1, không hỏi.
2. **Gap < 0.15** giữa ≥2 skills (tie hoặc gần tie) → trigger disambiguation:
   - Load `skills/ask/SKILL.md`
   - Hỏi user **MỘT** câu disambiguation duy nhất, dạng multiple-choice:
     ```
     Bạn muốn [A] làm X (skill A) hay [B] làm Y (skill B)?
     ```
   - Sau khi user trả lời, route đến skill được chọn.
3. **Confidence < 0.60** cho tất cả skills → hỏi user clarification qua `ask`.

### Ví dụ

| Top Skills | Confidence | Gap | Action |
|---|---|---|---|
| `fix`: 0.93, `ck-debug`: 0.88 | 0.05 | < 0.15 | Hỏi: "Bạn muốn [A] sửa lỗi ngay (fix) hay [B] tìm nguyên nhân trước (ck-debug)?" |
| `fix`: 0.95, `ck-debug`: 0.70 | 0.25 | ≥ 0.15 | Route trực tiếp `fix` |
| `frontend-development`: 0.82, `ui-ux-pro-max`: 0.78 | 0.04 | < 0.15 | Hỏi: "Bạn muốn [A] build component logic (frontend-development) hay [B] thiết kế giao diện đẹp (ui-ux-pro-max)?" |
| `scout`: 0.55, `context-engineering`: 0.50 | 0.05 | < 0.15 | Cả hai đều < 0.60 → hỏi clarification |

> For confidence scoring and tie-breaking rules, see `references/intent-classifier.md`

## Forbidden

- Do not use context-mode in this kit.
- Do not load broad design/media/AI skills by default.
- Do not read whole repositories or full reference directories.
- Do not ask user to choose a skill — **exception:** Confidence Gate disambiguation when gap < 0.15 (see above).
- Do not bypass privacy hook on final-report.

Detailed rules: `skills/orchestrator/references/workflow-rules.md` — đọc khi cần giải quyết edge case.
