---
name: ck:auto
description: "Spec-first autopilot: draft Spec, wait approval, route, implement, verify, report."
auto_load: true
argument-hint: "[natural-language-request]"
metadata:
  author: forgekit
  version: "2.2.0"
---

# Auto

`:ck:auto` is the only user-facing command.

## Prime Directive

User describes outcome. Assistant handles everything else.

1. Draft Spec.
2. Wait for one approval.
3. After approval: **Call `route_intent` MCP tool FIRST** — it's a native tool in your tool list.
4. Use `ck:orchestrator` + `ck:token-efficiency` rules.
5. Choose minimum skill/tool set based on routing result.
6. Implement safely.
7. Verify before success report.

## Spec Gate

Before approval:

- Do not edit files.
- Do not run implementation commands.
- Normalize intent using safe assumptions; do **not** ask follow-up questions unless blocked by a hard blocker.
- Ask only for hard blockers: credentials, destructive action, production payment/legal/security, impossible access.
- Use sections: Mục tiêu, Kết quả mong muốn, Giả định an toàn, Phạm vi sẽ làm, Ngoài phạm vi, Cách kiểm tra, Tiêu chí hoàn thành, Cần bạn xác nhận.

Approval examples: `Đúng, làm đi`, `OK làm đi`, `Approved`, `approved`, `Proceed`.
User confirms with any of the above → request is considered approved.

## After Approval

1. **MANDATORY FIRST**: Call `route_intent` MCP tool with the user intent. It auto-logs the decision. Do NOT skip.
   - Fallback (if MCP unavailable): `node scripts/route-intent.cjs "<user intent>"`
2. Load ONLY the primary skill from routing hint (per `maxPrimarySkillsInitial: 1`).
3. Create todos via `todo_write` to plan implementation steps.
4. Inspect lightly: use `fs_search` and targeted reads — no broad scouting.
5. Route using `skills/orchestrator/SKILL.md` only if route_intent returns `no-match`.
6. Enforce `skills/token-efficiency/SKILL.md`.
7. Use RTK for noisy shell if installed.
8. Use Serena MCP for large codebase/symbol/refactor if installed.
9. Do not use context-mode or cavemem.
10. Do NOT auto-load skills — use route_intent output only.
11. Implement incrementally; test and verify each step.
12. Run strongest available verification; fix failures and rerun unless blocked.
13. Final report: concise Vietnamese summary of what was done.

## Safety

- Preserve existing behavior.
- Prefer small changes.
- Never fake tests.
- Never ask user to choose skills/tools.
