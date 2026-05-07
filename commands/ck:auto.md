---
name: ck:auto
description: Spec-first ForgeCode-native autopilot for non-technical users
---

# ForgeKit Auto

Use `:ck:auto <desired outcome>` as the only user-facing entrypoint.

## Contract

1. Spec first. No implementation before approval.
2. One approval gate only.
3. After approval: inspect, route, implement, verify, fix, report.
4. User never chooses skills, agents, files, tests, or tools.
5. Never report success without verification.

## Phase A — Spec Gate

If no Spec has been approved in this conversation:

1. Treat request as outcome, not perfect technical instruction.
2. Do not edit files or run implementation commands.
3. Ask only if blocked by credentials, destructive risk, production payment/legal/security, or impossible access.
4. Draft concise Spec with exactly:
   - Mục tiêu
   - Kết quả mong muốn
   - Giả định an toàn
   - Phạm vi sẽ làm
   - Ngoài phạm vi
   - Cách kiểm tra
   - Tiêu chí hoàn thành
   - Cần bạn xác nhận
5. Ask approval: `Đúng, làm đi`, `OK làm đi`, `Approved`, or similar.

## Phase B — Autonomous Execution

After approval:

1. Create todos.
2. Load `ck:orchestrator` and `ck:token-efficiency` mentally or via skill tool when available.
3. Inspect lightly:
   - package/framework/test scripts
   - relevant files only
   - existing conventions
4. Route to the minimum skill/tool set.
5. Implement incrementally.
6. Verify with strongest available build/test/lint/typecheck/smoke check.
7. If verification fails, diagnose, fix, rerun.
8. Final report only after verification.

## Token Policy

- ForgeCode native tools first.
- Targeted `fs_search`/`read` before broad scout.
- Max 1 primary skill initially; secondary only when needed.
- Do not read full reference directories.
- Use RTK for noisy shell output if installed.
- Use Serena MCP for large repos, symbols, references, refactors if installed.
- Do not use context-mode in this kit.
- Use concise Vietnamese; keep code/path/command exact.

## Final Report

```markdown
## Kết quả
[Hoàn tất / Hoàn tất một phần / Bị chặn]

## Đã làm
- ...

## Đã kiểm tra
- ...

## File đã thay đổi
- `path`

## Ghi chú
- [Only if user action required]
```
