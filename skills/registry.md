# ForgeKit Skill Registry

Orchestrator reads this file to route tasks. Internal only. Do not expose as a user-facing command.

## Core (always available)

| Skill | Trigger keywords | Load path |
|---|---|---|
| auto | entrypoint, spec-first workflow | skills/auto/SKILL.md |
| orchestrator | internal routing, skill selection | skills/orchestrator/SKILL.md |
| token-efficiency | token policy, context budget, minimal reads | skills/token-efficiency/SKILL.md |

## Development

| Skill | Trigger keywords | Load path |
|---|---|---|
| backend-development | api, server, endpoint, auth, service, database query | skills/backend-development/SKILL.md |
| frontend-development | component, react, vue, page, hook, client UI logic | skills/frontend-development/SKILL.md |
| ui-ux-pro-max | design, UI, UX, web đẹp, giao diện, landing, responsive | skills/ui-ux-pro-max/SKILL.md |
| databases | schema, migration, query, postgres, postgresql, mongo, index | skills/databases/SKILL.md |
| web-frameworks | next.js, nextjs, nuxt, remix, vite config, ssr, app router | skills/web-frameworks/SKILL.md |

## Operations

| Skill | Trigger keywords | Load path |
|---|---|---|
| deploy | deploy, publish, ship, hosting, CI/CD, docker, production | skills/deploy/SKILL.md |
| git | commit, branch, merge, PR, pull request, push, conventional commit | skills/git/SKILL.md |
| security-scan | security, vulnerability, auth, injection, secret, OWASP, audit | skills/security-scan/SKILL.md |
| mcp-management | MCP, tool, server config, integration, external tool | skills/mcp-management/SKILL.md |

## Quality

| Skill | Trigger keywords | Load path |
|---|---|---|
| test | test, vitest, jest, playwright, coverage, e2e, unit, integration | skills/test/SKILL.md |
| code-review | review, refactor, clean up, best practice, quality, maintainability | skills/code-review/SKILL.md |
| ck-debug | bug, lỗi, error, không chạy, crash, failing, root cause | skills/ck-debug/SKILL.md |
| fix | fix, sửa, patch, broken, type error, lint error, failing test | skills/fix/SKILL.md |

## Project

| Skill | Trigger keywords | Load path |
|---|---|---|
| scout | codebase mới, chưa biết, explore, inspect, map project | skills/scout/SKILL.md |
| project-organization | structure, folder, organize, refactor arch, layout | skills/project-organization/SKILL.md |
| docs | tài liệu, README, docs, documentation, guide, changelog | skills/docs/SKILL.md |
