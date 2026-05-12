# ForgeKit Skill Registry

Orchestrator reads this file to route tasks. Internal only. Do not expose as a user-facing command.

## Core (always available)

| Skill | Trigger keywords | Load path |
|---|---|---|
| auto | entrypoint, spec-first workflow | skills/auto/SKILL.md |
| orchestrator | internal routing, skill selection | skills/orchestrator/SKILL.md |
| token-efficiency | token policy, context budget, minimal reads | skills/token-efficiency/SKILL.md |
| coding-level | giải thích đơn giản, non-tech, technical detail, how it works | skills/coding-level/SKILL.md |

## Development

| Skill | Trigger keywords | Load path |
|---|---|---|
| backend-development | api, server, endpoint, auth, service, database query | skills/backend-development/SKILL.md |
| frontend-development | component, react, vue, page, hook, client UI logic | skills/frontend-development/SKILL.md |
| ui-ux-pro-max | design, UI, UX, web đẹp, giao diện, landing, responsive | skills/ui-ux-pro-max/SKILL.md |
| databases | schema, migration, query, postgres, postgresql, mongo, index | skills/databases/SKILL.md |
| web-frameworks | next.js, nextjs, nuxt, remix, vite config, ssr, app router, setup framework, init nextjs, tailwind config | skills/web-frameworks/SKILL.md |

## Operations

| Skill | Trigger keywords | Load path |
|---|---|---|
| deploy | deploy, publish, ship, hosting, CI/CD, docker, production | skills/deploy/SKILL.md |
| git | commit, branch, merge, PR, pull request, push, conventional commit, đẩy code, tạo PR | skills/git/SKILL.md |
| security-scan | security, vulnerability, auth, injection, secret, OWASP, audit | skills/security-scan/SKILL.md |
| mcp-management | MCP, tool, server config, integration, external tool | skills/mcp-management/SKILL.md |

## Quality

| Skill | Trigger keywords | Load path |
|---|---|---|
| test | test, vitest, jest, playwright, coverage, e2e, unit, integration, chạy test | skills/test/SKILL.md |
| code-review | review, refactor, clean up, best practice, quality, maintainability, improve, cải thiện code, code smell, technical debt | skills/code-review/SKILL.md |
| ck-debug | bug, lỗi, error, không chạy, crash, failing, root cause, không chịu chạy, bấm gì cũng tắt, hay bị treo, app bị treo, đơ khi | skills/ck-debug/SKILL.md |
| fix | fix, sửa, patch, broken, type error, lint error, failing test | skills/fix/SKILL.md |

## Project

| Skill | Trigger keywords | Load path |
|---|---|---|
| scout | codebase mới, chưa biết, explore, inspect, map project, sơ đồ project, luồng code | skills/scout/SKILL.md |
| context-engineering | codebase lớn, chưa biết, symbol, refactor cross-file, tìm function, tìm symbol, sơ đồ codebase, unfamiliar repo | skills/context-engineering/SKILL.md |
| diff-context | diff, changed files, git diff, fix context, refactor context, reverse deps, patch context, minimal context, thay đổi gì, luồng thay đổi, code thay đổi | skills/diff-context/SKILL.md |
| ask | thiếu thông tin, chưa rõ, mơ hồ, không biết bắt đầu từ đâu, ambiguous, không rõ | skills/ask/SKILL.md |
| watzup | watzup, status, project status, đang làm gì, tiến độ | skills/watzup/SKILL.md |
| repomix | repomix, codebase summary, tóm tắt codebase, map project, sơ đồ project, luồng code | skills/repomix/SKILL.md |
| repo-map | repo map, skeleton map, ranked signatures, repomap, orient codebase, tree-sitter map, PageRank code, sơ đồ repo, skeleton codebase, orient repo | skills/repo-map/SKILL.md |
| code-map | code map, code2prompt, gitingest, map codebase, fallback summary, Serena unavailable, tóm tắt codebase, sơ đồ code | skills/code-map/SKILL.md |
| project-organization | structure, folder, organize, refactor arch, layout | skills/project-organization/SKILL.md |
| docs | tài liệu, README, docs, documentation, guide, changelog, viết tài liệu | skills/docs/SKILL.md |

## Domain (specialist, loaded on-demand only)

| Skill | Trigger keywords | Load path |
|---|---|---|
| auth | login, signup, jwt, session, oauth, đăng nhập, đăng ký, authentication, authorization, rbac | skills/auth/SKILL.md |
| payment-integration | stripe, paypal, momo, vnpay, checkout, subscription, thanh toán, payment, billing | skills/payment-integration/SKILL.md |
| web-testing | playwright, cypress, e2e, browser test, smoke test UI, visual regression | skills/web-testing/SKILL.md |
| ai-multimodal | openai, anthropic, gemini, image generation, vision, transcribe, embedding, chatbot, AI integration | skills/ai-multimodal/SKILL.md |
| document-processing | pdf, docx, xlsx, pptx, parse document, extract text, generate report | skills/document-processing/SKILL.md |
| browser-automation | scrape, crawl, headless, automate browser, screenshot, puppeteer, data extraction | skills/browser-automation/SKILL.md |
