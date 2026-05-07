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
- Ask only for hard blockers: credentials, destructive action, production payment/legal/security, impossible access.
- Use sections: Mục tiêu, Kết quả mong muốn, Giả định an toàn, Phạm vi sẽ làm, Ngoài phạm vi, Cách kiểm tra, Tiêu chí hoàn thành, Cần bạn xác nhận.

Approval examples: `Đúng, làm đi`, `OK làm đi`, `Approved`, `Proceed`.

## After Approval

1. Create todos.
2. Inspect lightly with native ForgeCode tools.
3. Route using `skills/orchestrator/SKILL.md`.
4. Enforce `skills/token-efficiency/SKILL.md`.
5. Use RTK for noisy shell if installed.
6. Use Serena MCP for large codebase/symbol/refactor if installed.
7. Do not use context-mode or cavemem.
8. Run strongest available verification.
9. Fix failures and rerun unless blocked.
10. Final report concise Vietnamese.

## Safety

- Preserve existing behavior.
- Prefer small changes.
- Never fake tests.
- Never ask user to choose skills/tools.
