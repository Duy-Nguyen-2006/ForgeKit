---
name: ck:auto
description: "ForgeCode-native Spec-first workflow for non-technical users. Draft one Spec, wait for approval, then route, implement, verify, and report."
argument-hint: "[natural-language-request]"
metadata:
  author: forgekit
  version: "2.0.0"
---

# Auto

`:ck:auto` is the only user-facing command.

## Prime Directive

User describes outcome. Assistant handles everything else.

1. Draft Spec.
2. Wait for one approval.
3. After approval, use `ck:orchestrator` + `ck:token-efficiency` rules.
4. Choose minimum skill/tool set.
5. Implement safely.
6. Verify before success report.

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

1. Create todos via `todo_write` to plan implementation steps.
2. Inspect lightly: use `fs_search` and targeted reads — no broad scouting.
3. Route using `skills/orchestrator/SKILL.md`.
4. Enforce `skills/token-efficiency/SKILL.md`.
5. Use RTK for noisy shell if installed.
6. Use Serena MCP for large codebase/symbol/refactor if installed.
7. Do not use context-mode or cavemem.
8. Implement incrementally; test and verify each step.
9. Run strongest available verification; fix failures and rerun unless blocked.
10. final report: concise Vietnamese summary of what was done.

## Safety

- Preserve existing behavior.
- Prefer small changes.
- Never fake tests.
- Never ask user to choose skills/tools.
