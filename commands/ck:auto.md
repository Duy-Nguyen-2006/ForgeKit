---
name: ck:auto
description: Spec-first ForgeCode-native autopilot for non-technical users
auto_load: true
---

# ForgeKit Auto

Use `:ck:auto <desired outcome>` as the only user-facing entrypoint.

## Contract

1. Spec first. No implementation before approval.
2. One approval gate only.
3. After approval: **ROUTE FIRST**, then inspect, implement, verify, fix, report.
4. User never chooses skills, agents, files, tests, or tools.
5. Never report success without verification.
6. **MANDATORY**: Call `route_intent` MCP tool before loading any skill — no exceptions.

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

### ⚠️ B.0 — MANDATORY FIRST ACTION (DO NOT SKIP)

**Before doing ANYTHING else** (no todo_write, no fs_search, no read, no skill load):

**Call the `route_intent` MCP tool** — it is available as a native tool in your tool list:

```
route_intent(intent: "<EXACT user intent string>")
```

The tool returns:
- **primary** — The skill to load
- **secondary** — Skills available if needed
- **confidence** — How certain the routing is
- **action** — What to do next

Then follow the action:
- **action = `route`** → Load ONLY the `primary` skill. Proceed to B.1.
- **action = `route-uncertain`** → Load ONLY the `primary` skill. Note uncertainty. Proceed to B.1.
- **action = `disambiguate`** → Ask user ONE question from the response. STOP until user answers.
- **action = `clarify`** → Ask user for clarification. STOP until user answers.
- **action = `no-match`** → Fall back to prompt-based orchestrator routing.

**Fallback** (only if MCP tools are unavailable):

```
node scripts/route-intent.cjs "<EXACT user intent string>"
```

Then log manually:
```
echo '{"intent":"<user intent>","primary":"<result>","secondary":<result>,"confidence":<result>,"action":"<result>","gap":<result>,"verb":"<result>"}' | node hooks/post-tool/route-log.cjs
```

**CRITICAL**: If you skip this step and load skills directly, routing is UNVERIFIED and UNOBSERVABLE. The `route_intent` tool auto-logs decisions — no manual logging needed when using MCP.

### B.1 — Plan

1. Create todos based on routing hint.
2. Load `ck:orchestrator` and `ck:token-efficiency` mentally — do NOT auto-load them as skills.

### B.2 — Execute

3. Load PRIMARY skill only (per `maxPrimarySkillsInitial: 1`). Do NOT load secondary skills yet.
4. Inspect lightly:
   - package/framework/test scripts
   - relevant files only
   - existing conventions
5. Implement incrementally.
6. If task requires a secondary skill (based on routing hint), load it now — one at a time, only when needed.
7. Verify with strongest available build/test/lint/typecheck/smoke check.
8. If verification fails, diagnose, fix, rerun.

### B.3 — Report

9. Final report only after verification.

## Token Policy

- **Route BEFORE loading skills** — prevents unnecessary skill auto-load.
- **Use `route_intent` MCP tool** — it's in your tool list, always call it first.
- ForgeCode native tools first.
- Targeted `fs_search`/`read` before broad scout.
- **Max 1 primary skill initially**; secondary only when routing hint says so.
- Do NOT auto-load skills based on keyword matching — use route_intent output only.
- Do not read full reference directories.
- Use RTK for noisy shell output if installed.
- Use GitNexus MCP for large repos, symbols, references, refactors if installed.
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
