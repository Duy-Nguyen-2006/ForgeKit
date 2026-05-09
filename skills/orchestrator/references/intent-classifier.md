# Intent Classifier — Few-Shot Routing Guide

Orchestrator dùng bảng này để phân loại ý định user → skill routing.
Quy tắc cốt lõi: **động từ chính > danh từ phụ** — hành động user muốn làm quyết định primary skill, đối tượng chỉ quyết định secondary.

---

## Tie-Breaking Rule: Ưu tiên động từ chính > danh từ phụ

Khi user nói câu chứa nhiều signal trùng lặp, phân tích theo động từ chính:

| Động từ chính | Primary skill |
|---|---|
| fix, sửa, khắc phục, resolve, patch | `fix` |
| debug, tìm lỗi, investigate, diagnose | `ck-debug` |
| tạo, add, build, implement, viết mới | → dựa vào đối tượng (backend/frontend/db) |
| deploy, ship, publish, đưa lên | `deploy` |
| review, kiểm tra code, audit | `code-review` |
| test, kiểm thử, coverage | `test` |
| tìm, locate, search, explore, map | `scout` hoặc `context-engineering` |
| thiết kế, design, UI, UX | `ui-ux-pro-max` |
| viết docs, tài liệu, README | `docs` |
| commit, push, merge, PR | `git` |
| bảo mật, security, vulnerability | `security-scan` |
| tổ chức, structure, refactor arch | `project-organization` |
| tổng hợp codebase, repomix | `repomix` |
| hỏi, chưa rõ, mơ hồ | `ask` |
| giải thích, explain, đơn giản | `coding-level` |
| so sánh diff, thay đổi gì | `diff-context` |
| map repo structure | `repo-map` |
| map code symbols/flow | `code-map` |

**Ví dụ tie-break:**
- "Fix lỗi database" → động từ = fix → primary `fix`, secondary `databases` (không phải primary `databases`)
- "Deploy backend API" → động từ = deploy → primary `deploy`, secondary `backend-development`
- "Review code frontend" → động từ = review → primary `code-review`, secondary `frontend-development`

---

## Few-Shot Examples

### 🐛 Bug / Fix / Debug

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 1 | "Sửa lỗi TypeError ở file user.ts" | `fix` | `ck-debug` | 0.95 |
| 2 | "Fix failing test trong auth module" | `fix` | `test` | 0.93 |
| 3 | "App crash khi bấm nút submit" | `ck-debug` | `fix` | 0.90 |
| 4 | "Linter báo 12 errors, sửa hết" | `fix` | — | 0.95 |
| 5 | "Type error khi build, sửa nhanh" | `fix` | — | 0.94 |
| 6 | "Debug tại sao API trả 500" | `ck-debug` | `backend-development` | 0.92 |
| 7 | "Tìm root cause CI fail" | `ck-debug` | `test` | 0.88 |
| 8 | "Investigate memory leak trong service" | `ck-debug` | `backend-development` | 0.90 |

### 🔧 Backend / API

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 9 | "Tạo API endpoint GET /users" | `backend-development` | `databases` | 0.93 |
| 10 | "Add authentication bằng JWT" | `backend-development` | `security-scan` | 0.91 |
| 11 | "Implement rate limiting cho API" | `backend-development` | `security-scan` | 0.89 |
| 12 | "Tạo REST API CRUD cho products" | `backend-development` | `databases` | 0.94 |
| 13 | "Setup WebSocket cho real-time chat" | `backend-development` | `frontend-development` | 0.87 |
| 14 | "Viết middleware validate request body" | `backend-development` | — | 0.92 |

### 🎨 Frontend / UI

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 15 | "Tạo component Card mới" | `frontend-development` | — | 0.94 |
| 16 | "Thiết kế landing page đẹp" | `ui-ux-pro-max` | `frontend-development` | 0.92 |
| 17 | "Make the dashboard responsive" | `ui-ux-pro-max` | `frontend-development` | 0.91 |
| 18 | "Add dark mode toggle" | `frontend-development` | `ui-ux-pro-max` | 0.89 |
| 19 | "Tạo form đăng ký với validation" | `frontend-development` | — | 0.93 |
| 20 | "Build React hook cho data fetching" | `frontend-development` | — | 0.94 |

### 🗄️ Database

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 21 | "Tạo migration thêm cột email" | `databases` | — | 0.96 |
| 22 | "Tối ưu query chậm ở bảng orders" | `databases` | `backend-development` | 0.91 |
| 23 | "Setup PostgreSQL schema cho project mới" | `databases` | `backend-development` | 0.92 |
| 24 | "Add index cho bảng users" | `databases` | — | 0.95 |
| 25 | "Viết aggregation pipeline MongoDB" | `databases` | — | 0.94 |

### 🚀 Deploy / Operations

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 26 | "Deploy lên Vercel" | `deploy` | — | 0.96 |
| 27 | "Setup CI/CD pipeline" | `deploy` | `git` | 0.90 |
| 28 | "Config Docker cho production" | `deploy` | `security-scan` | 0.89 |
| 29 | "Publish package lên npm" | `deploy` | — | 0.94 |

### 🔐 Security

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 30 | "Scan vulnerability trong dependencies" | `security-scan` | — | 0.95 |
| 31 | "Kiểm tra có lộ secret không" | `security-scan` | `git` | 0.93 |
| 32 | "Audit OWASP cho API" | `security-scan` | `backend-development` | 0.91 |

### 🧪 Test / Review

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 33 | "Viết unit test cho utils" | `test` | — | 0.96 |
| 34 | "Add E2E test cho login flow" | `test` | `frontend-development` | 0.91 |
| 35 | "Review code PR #42" | `code-review` | — | 0.95 |
| 36 | "Check code quality toàn module" | `code-review` | `scout` | 0.88 |
| 37 | "Tăng test coverage lên 80%" | `test` | — | 0.94 |

### 🔍 Scout / Context / Explore

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 38 | "Map toàn bộ project structure" | `repo-map` | — | 0.94 |
| 39 | "Codebase này có gì, chưa biết bắt đầu đâu" | `scout` | `ask` | 0.87 |
| 40 | "Tìm tất cả file dùng function handleSubmit" | `context-engineering` | — | 0.92 |
| 41 | "Xem diff giữa branch main và feature" | `diff-context` | `git` | 0.93 |
| 42 | "Map code flow từ request đến response" | `code-map` | `context-engineering` | 0.90 |
| 43 | "Tóm tắt codebase cho AI context" | `repomix` | — | 0.95 |
| 44 | "Tìm reference của class UserService" | `context-engineering` | — | 0.93 |

### 📁 Project / Docs / Git

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 45 | "Tổ chức lại folder structure" | `project-organization` | — | 0.94 |
| 46 | "Viết README cho project" | `docs` | — | 0.96 |
| 47 | "Commit với conventional format" | `git` | — | 0.96 |
| 48 | "Tạo PR merge feature/auth vào main" | `git` | `code-review` | 0.92 |
| 49 | "Update API documentation" | `docs` | `backend-development` | 0.90 |
| 50 | "Chạy watzup xem tiến độ project" | `watzup` | — | 0.95 |

### 🌐 Web Frameworks

| # | User Intent | Primary | Secondary | Confidence |
|---|---|---|---|---|
| 51 | "Setup Next.js app router" | `web-frameworks` | `frontend-development` | 0.94 |
| 52 | "Config Vite cho React project" | `web-frameworks` | `frontend-development` | 0.92 |
| 53 | "Migrate sang Turborepo" | `web-frameworks` | `project-organization` | 0.89 |

### 🔀 Cross-Domain / Ambiguous

| # | User Intent | Primary | Secondary | Confidence | Note |
|---|---|---|---|---|---|
| 54 | "Tạo full-stack feature login" | `backend-development` | `frontend-development`, `databases` | 0.82 | Động từ "tạo" + backend auth là core, FE phụ |
| 55 | "Fix UI bug ở dashboard" | `fix` | `frontend-development` | 0.91 | Động từ = fix, đối tượng = UI |
| 56 | "Deploy và scan security" | `deploy` | `security-scan` | 0.85 | Động từ chính = deploy, scan là bước phụ |
| 57 | "Refactor và review code" | `code-review` | `project-organization` | 0.83 | Review là động từ chính, refactor phụ |
| 58 | "Setup MCP tool mới" | `mcp-management` | — | 0.94 | Động từ + đối tượng đều trỏ MCP |
| 59 | "Giải thích code này làm gì" | `coding-level` | — | 0.95 | Động từ = giải thích → coding-level |
| 60 | "Explain the auth flow simply" | `coding-level` | `context-engineering` | 0.89 | Động từ = explain, cần context trước |

---

## Confidence Scoring Rules

### Tính điểm confidence (0.0 – 1.0)

| Factor | Rule | Impact |
|---|---|---|
| **Verb match** | Động từ chính khớp rõ với 1 skill | +0.30 |
| **Noun match** | Danh từ/đối tượng khớp với skill keywords | +0.20 |
| **Single skill clear** | Chỉ 1 skill match rõ ràng, không ambiguity | +0.25 |
| **Registry keyword** | Keyword xuất hiện trong registry.md trigger list | +0.15 |
| **Context match** | File extension, tech stack, hoặc path xác nhận skill | +0.10 |

### Confidence thresholds

| Range | Action |
|---|---|
| **0.90 – 1.00** | Route trực tiếp, không cần hỏi |
| **0.75 – 0.89** | Route primary, load secondary sẵn — không hỏi |
| **0.60 – 0.74** | Route primary, **ghi chú uncertainty** trong reasoning |
| **< 0.60** | Hỏi user 1 câu rõ ràng (dùng `ask`) trước khi route |

### Confidence decay

- Intent dài > 50 từ: confidence -0.05 (nhiễu nhiều)
- Intent chứa 3+ skill keywords khác nhóm: -0.10 (ambiguous)
- Intent chỉ chứa danh từ, không động từ: -0.15 (thiếu hành động)

---

## Ambiguity Resolution Patterns

### Pattern 1: Fix vs Debug

| Signal | Route to |
|---|---|
| Có error message cụ thể, stack trace, line number | `fix` (biết lỗi rồi, cần sửa) |
| "tại sao", "why", "không hiểu", "investigate" | `ck-debug` (chưa biết nguyên nhân) |
| "sửa nhanh", "quick fix", "patch" | `fix` + `--quick` |
| "tìm root cause", "diagnose" | `ck-debug` |

### Pattern 2: Frontend vs UI-UX

| Signal | Route to |
|---|---|
| "component", "hook", "state", "render", "props" | `frontend-development` |
| "đẹp", "responsive", "layout", "color", "spacing", "animation" | `ui-ux-pro-max` |
| "tạo page" + "đẹp" | `ui-ux-pro-max` primary, `frontend-development` secondary |
| "tạo component" (không nói UI) | `frontend-development` |

### Pattern 3: Scout vs Context-Engineering

| Signal | Route to |
|---|---|
| "có gì", "explore", "chưa biết codebase" | `scout` |
| "tìm function", "symbol", "reference", "cross-file" | `context-engineering` |
| "tóm tắt toàn bộ codebase" | `repomix` |
| "map project structure" | `repo-map` |
| "xem code flow" | `code-map` |
| "so sánh thay đổi" | `diff-context` |

### Pattern 4: Backend vs Databases

| Signal | Route to |
|---|---|
| "API", "endpoint", "service", "middleware", "auth" | `backend-development` |
| "schema", "migration", "query", "index", "table" | `databases` |
| "tạo API" + "cần table mới" | `backend-development` primary, `databases` secondary |
| "tối ưu query" (chỉ DB layer) | `databases` |

### Pattern 5: Deploy vs Security-Scan

| Signal | Route to |
|---|---|
| "deploy", "ship", "publish", "hosting" | `deploy` |
| "scan", "audit", "vulnerability", "OWASP" | `security-scan` |
| "deploy production" | `deploy` primary, `security-scan` secondary (luôn scan trước production) |
| "kiểm tra bảo mật trước khi deploy" | `security-scan` primary, `deploy` secondary |

### Pattern 6: Code-Review vs Test

| Signal | Route to |
|---|---|
| "review", "quality", "best practice", "maintainability" | `code-review` |
| "test", "coverage", "vitest", "jest", "e2e" | `test` |
| "ensure code works" | `test` |
| "ensure code is good" | `code-review` |

### Pattern 7: Multi-intent Sentences

Khi user nói 1 câu chứa nhiều intent:

1. **Tách theo động từ:** mỗi động từ chính = 1 sub-intent
2. **Ưu tiên theo thứ tự user nói** (động từ trước = primary)
3. **Workflow:** primary skill xử lý main intent, secondary skills xử lý theo sequence

| Multi-intent | Primary | Secondary | Sequence |
|---|---|---|---|
| "Fix lỗi và viết test" | `fix` | `test` | Fix trước → test sau |
| "Review rồi deploy" | `code-review` | `deploy` | Review trước → deploy sau |
| "Tạo API và setup DB" | `backend-development` | `databases` | API trước → DB cùng lúc |
| "Refactor và commit" | `code-review` | `git` | Refactor/review trước → commit sau |
| "Debug và fix" | `ck-debug` | `fix` | Debug trước → fix sau khi biết cause |

---

## NEW Skills: repo-map, diff-context, code-map

| Skill | Trigger | Use When |
|---|---|---|
| `repo-map` | "map repo", "project structure", "folder layout", "sơ đồ project" | Cần overview thư mục, không cần đọc code |
| `diff-context` | "diff", "thay đổi gì", "what changed", "so sánh branch" | Cần hiểu sự khác biệt giữa version/branch |
| `code-map` | "code flow", "call chain", "dependency graph", "luồng code" | Cần hiểu symbol-level flow và relationship |

### NEW vs Existing overlap resolution

| Intent | NOT this | USE this | Reason |
|---|---|---|---|
| "Xem project structure" | `scout` | `repo-map` | Chỉ cần folder layout, không cần file content |
| "So sánh code giữa 2 branch" | `context-engineering` | `diff-context` | Chỉ cần diff, không cần symbol search |
| "Map call chain" | `scout` | `code-map` | Cần symbol-level, không chỉ file discovery |
| "Explore toàn bộ codebase chưa biết" | `repo-map` | `scout` | Cần deep explore, không chỉ structure overview |

---

## Vietnamese Intent Patterns

User Việt Nam thường dùng pattern này — nhận diện để route chính xác:

| Pattern | Meaning | Primary |
|---|---|---|
| "Sửa lỗi X" | Fix bug X | `fix` |
| "Tạo mới Y" | Create Y | → theo đối tượng Y |
| "Không chạy được" | Doesn't work | `ck-debug` |
| "Đưa lên server" | Deploy | `deploy` |
| "Viết test cho" | Write test for | `test` |
| "Kiểm tra code" | Review code | `code-review` |
| "Làm đẹp UI" | Make UI pretty | `ui-ux-pro-max` |
| "Cài đặt X" | Setup X | → theo X (framework/deploy/db) |
| "Tối ưu Y" | Optimize Y | → theo Y (db/performance) |
| "Tìm hiểu codebase" | Explore codebase | `scout` |
| "Chạy thử" | Try running | `test` hoặc `ck-debug` |
| "Giải thích" | Explain | `coding-level` |
| "Tổ chức lại" | Reorganize | `project-organization` |
| "Bảo mật" | Security | `security-scan` |
| "Lưu lại" / "Commit" | Save/commit | `git` |
| "Xem diff" / "Thay đổi gì" | See changes | `diff-context` |
| "Map project" | Map project | `repo-map` |
| "Xem luồng code" | See code flow | `code-map` |

---

## Quick Lookup: Intent → Skill (Sorted by Skill)

| Intent Keyword | → Primary Skill |
|---|---|
| fix, sửa, patch, broken, type error, lint error | `fix` |
| debug, lỗi, investigate, root cause, crash | `ck-debug` |
| API, server, endpoint, auth, middleware | `backend-development` |
| component, React, Vue, page, hook | `frontend-development` |
| UI, UX, design, đẹp, responsive, layout | `ui-ux-pro-max` |
| schema, migration, query, postgres, mongo | `databases` |
| Next.js, Vite, SSR, app router, Turborepo | `web-frameworks` |
| deploy, publish, ship, hosting, CI/CD | `deploy` |
| commit, branch, PR, merge, push | `git` |
| security, vulnerability, audit, secret | `security-scan` |
| test, vitest, jest, coverage, e2e | `test` |
| review, quality, refactor, best practice | `code-review` |
| explore, map, chưa biết, codebase mới | `scout` |
| symbol, reference, cross-file, unfamiliar | `context-engineering` |
| hỏi, chưa rõ, mơ hồ | `ask` |
| status, tiến độ, watzup | `watzup` |
| tóm tắt codebase, repomix | `repomix` |
| structure, organize, folder | `project-organization` |
| docs, README, tài liệu | `docs` |
| giải thích, explain, đơn giản | `coding-level` |
| MCP, tool config, integration | `mcp-management` |
| map repo, folder structure | `repo-map` |
| diff, thay đổi, so sánh | `diff-context` |
| code flow, call chain, symbol graph | `code-map` |
