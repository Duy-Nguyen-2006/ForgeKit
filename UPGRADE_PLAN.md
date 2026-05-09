# ForgeKit Upgrade Plan

> Nguồn: báo cáo so sánh ForgeKit vs Claudev (https://github.com/Duy-Nguyen-2006/Claudev).
> Mục tiêu: bịt các điểm yếu được nêu trong báo cáo **mà không phá vỡ nguyên tắc lõi** của ForgeKit.

## 0. Nguyên tắc bất biến (non-negotiable)

Bất kỳ đề xuất nào trong tài liệu này nếu mâu thuẫn với danh sách dưới đây thì bị loại.

1. **Một entrypoint duy nhất cho người dùng: `:ck:auto`.** Không thêm `/ck:plan`, `/ck:cook`, `/ck:fix`, `/ck:test`, `/ck:review`, `/ck:watzup`,… như Claudev. Mọi skill mới chỉ được route nội bộ qua orchestrator.
2. **Spec-first, một approval gate.** Người dùng chỉ tương tác hai lần: (a) gõ `:ck:auto <yêu cầu>`, (b) duyệt Spec.
3. **User không bao giờ chọn skill, agent, file, test, tool.** Mọi UI/CLI/skill mới phải tuân thủ hoặc bị từ chối.
4. **ForgeCode-native first.** Codex/Claude là compatibility layer, không được upgrade ngang hàng.
5. **Token efficiency là yêu cầu cứng.** Bất kỳ asset/skill mới nào làm tăng token nền (bloat repo, load mặc định, asset media nặng) đều bị loại.
6. **Repo cleanliness.** Không thêm media/binary nặng vào repo. Demo assets nếu có phải nằm ở repo phụ hoặc release artifact.
7. **Output Việt ngắn gọn theo mặc định.**

Mọi PR thực thi plan này phải có checkbox xác nhận tuân thủ 7 điểm trên trong description.

---

## 1. Tóm tắt vấn đề từ báo cáo

Nhóm điểm yếu cần xử lý (đã lọc theo nguyên tắc §0):

- **Hạ tầng repo:** thiếu `LICENSE`, thiếu `CHANGELOG.md`, root `npm test` chưa thật, không có GitHub Actions.
- **Runtime enforcement:** hook hiện tại là docs (`HOOK.md`), chưa phải JS thực thi như Claudev.
- **Validation:** chưa có script kiểm tra `forgekit.json`, `.forge.toml`, `skills/registry.md`, frontmatter skill.
- **Breadth skill chuyên ngành:** thiếu auth, payment, web-testing, ai-multimodal, document-processing, browser-automation.
- **Status/session telemetry:** Claudev có statusline + session-state; ForgeKit chỉ có khái niệm.
- **Docs kiến trúc:** chưa có file mô tả tổng thể luồng `:ck:auto`.

Nhóm điểm yếu **bỏ qua** (xung đột nguyên tắc lõi):

- Nhiều entrypoint kiểu `/ck:*` → vi phạm §0.1.
- Statusline UI nặng cho power-user → không cần thiết với non-tech UX.
- Media/font/demo assets nhúng repo → vi phạm §0.6.
- CLI mới ngoài `npx lgmmo-forgekit-installer` → vi phạm §0.3.

---

## 2. Lộ trình theo phase

Mỗi phase ra một bản release riêng (v2.2.0, v2.3.0, v2.4.0). Mỗi release đều phải pass adapter tests + mọi gate ở §6.

### Phase 1 — Hạ tầng (v2.2.0, P0)

Mục tiêu: bịt các thiếu sót “không cần tranh cãi” từ báo cáo. Không thêm tính năng người dùng.

| # | Việc | Output | Lý do |
|---|---|---|---|
| 1.1 | Thêm `LICENSE` (MIT) ở root | `LICENSE` | `package.json` đã ghi MIT nhưng repo chưa có file vật lý. |
| 1.2 | Tạo `CHANGELOG.md` chuẩn Keep a Changelog, migrate phần Release Notes hiện trong README sang | `CHANGELOG.md`, README dọn lại | Giúp release auditing, thay vì chôn note trong README. |
| 1.3 | Sửa `package.json` `scripts.test` chạy đầy đủ adapter + auto + auto-contract test bằng Node, không còn placeholder | `npm test` chạy 5 file `.test.cjs` ở `skills/auto/scripts/` | Báo cáo nêu Claudev fail vì test placeholder; ForgeKit phải làm đúng. |
| 1.4 | Thêm `scripts.lint` thật: validator JSON/TOML/Markdown frontmatter (xem §3.1) | `npm run lint` | Tránh lặp lỗi Claudev `echo "Linting passed"`. |
| 1.5 | Thêm GitHub Actions `.github/workflows/ci.yml` (Node 18/20 matrix) chạy `npm test` + `npm run lint` + `python3 scripts/generate-*.py --dry-run` | CI pass trên PR | Báo cáo nêu thiếu CI. |
| 1.6 | Thêm `.github/workflows/release.yml` tự `npm publish` khi push tag `v*` (cần secret `NPM_TOKEN`) | Tag-driven release | Thay cho semantic-release nặng của Claudev. |
| 1.7 | Thêm `CONTRIBUTING.md` ngắn (1 trang) + `CODE_OF_CONDUCT.md` mẫu | Onboarding contributors | Báo cáo nêu thiếu docs onboarding cho contributor. |
| 1.8 | Thêm `.github/PULL_REQUEST_TEMPLATE.md` có checkbox §0 | Mọi PR phải tự xác nhận giữ nguyên tắc | Bảo vệ contract `:ck:auto`. |
| 1.9 | `.forgeignore`/`.gitignore` review: thêm `.forge-backup-*`, `.codex/`, `.claude/`, `*.tsbuildinfo` | Tránh commit nhầm runtime | An toàn. |

Acceptance:

- `npm test` chạy ≥7 test (auto.test.cjs) + 3 adapter test + auto-contract → tất cả pass.
- CI badge xanh trên main.
- README chỉ còn quickstart + link tới CHANGELOG.

### Phase 2 — Runtime hooks & validation (v2.3.0, P1)

Mục tiêu: nâng các `HOOK.md` từ tài liệu thành runtime nhỏ gọn, tương đương Claudev nhưng giữ surface tối thiểu. Người dùng tuyệt đối không phải config thủ công — installer wire sẵn.

| # | Việc | Output | Lý do |
|---|---|---|---|
| 2.1 | `hooks/privacy/privacy-block.cjs` — đọc stdin JSON (tool input), match `hooks/privacy/patterns.json`, exit 2 nếu match secret/file nhạy cảm. | File JS thực thi, ≤120 LOC | Báo cáo: Claudev có `privacy-block.cjs` thật; ForgeKit chỉ có docs. |
| 2.2 | `hooks/pre-tool/budget-guard.cjs` — đếm token ước lượng (chars/4) cho payload tool, exit 2 hoặc downgrade gợi ý nếu vượt cap (mặc định 8K). | File JS ≤80 LOC | Hiện chỉ là `.md`. Phải thực thi. |
| 2.3 | `hooks/session-start/session-init.cjs` — in 1 dòng tóm tắt branch + dirty state khi mở session, không dump nội dung file. | File JS ≤60 LOC | Lightweight tương đương Claudev `session-init.cjs`, nhưng không trở thành statusline. |
| 2.4 | `hooks/notifications/notify.cjs` — adapter Telegram/Discord/Slack qua webhook env. Disabled mặc định. | File JS, gated qua env var | User không kỹ thuật không cần bật. |
| 2.5 | `forgekit.json` `hooks.*.config` đổi từ trỏ `.md` sang trỏ `.cjs`, giữ `.md` làm tài liệu cạnh hook. | Config nhất quán | Chuẩn hoá. |
| 2.6 | Installer (`bin/lgmmo-forgekit-installer.js`) copy luôn `.cjs` hooks và set executable. | Hook hoạt động sau install | UX. |
| 2.7 | Test mới `skills/auto/scripts/hooks.test.cjs` — chạy mỗi hook với input giả, kiểm exit code/output. | Pass trong CI | Tránh hook silently broken. |

Acceptance:

- 4 hook chạy được standalone với `node <path> < input.json`.
- Không hook nào tăng prompt cho người dùng (im lặng trừ khi cần block).
- Installer test (smoke) chứng minh `.cjs` được copy + chmod.

Phase 2.b — Validators (cùng release):

| # | Việc | Output |
|---|---|---|
| 2.8 | `scripts/validate-forgekit.cjs` — schema check `forgekit.json` (entrypoint duy nhất là `:ck:auto`). | Lint exit 1 nếu vi phạm |
| 2.9 | `scripts/validate-registry.cjs` — kiểm `skills/registry.md` đầy đủ trigger keywords, mọi `Load path` tồn tại, mọi skill có `SKILL.md` với frontmatter `triggers/non_triggers/examples`. | Lint exit 1 nếu thiếu |
| 2.10 | `scripts/validate-skills.cjs` — mọi `SKILL.md` ngắn (≤200 dòng); references/scripts không bị tham chiếu nhầm. | Lint exit 1 nếu vi phạm |
| 2.11 | Hợp nhất vào `npm run lint` (Phase 1.4). | One command |

### Phase 3 — Skill breadth có chọn lọc (v2.4.0, P1, đã chốt: 6 skill)

Tất cả skill mới **chỉ được orchestrator load**, **không** xuất hiện như entrypoint cho user. README không nhắc tên skill ở user-facing section; chỉ nhắc trong `skills/registry.md` và docs nội bộ.

Mỗi skill phải:

- Có `SKILL.md` ≤150 dòng + frontmatter `triggers/non_triggers/examples`.
- Không load mặc định; chỉ load khi orchestrator route theo trigger.
- Có ít nhất 1 entry trong `skills/registry.md`.
- Không kéo binary/asset > 50 KB; tham chiếu tool ngoài thay vì nhúng.

| Skill | Trigger keywords (ví dụ) | Phụ thuộc ngoài | Ghi chú |
|---|---|---|---|
| `auth` | login, signup, jwt, session, oauth, đăng nhập, đăng ký | none | Patterns + checklist OWASP-light. Hợp tác với `security-scan`. |
| `payment-integration` | stripe, paypal, momo, vnpay, checkout, subscription, thanh toán | none | Tập trung Stripe (theo ví dụ ck-auto). Tránh secrets, dùng env. |
| `web-testing` | playwright, cypress, e2e, browser test, smoke test UI | playwright (optional) | Bổ sung cho `test` skill, không thay thế. |
| `ai-multimodal` | openai, anthropic, gemini, image, vision, transcribe, embedding | provider SDK người dùng đã có | Pattern thôi, không bundle SDK. |
| `document-processing` | pdf, docx, xlsx, pptx, parse, extract | unzipper / pdfjs (optional) | Hướng dẫn xử lý theo loại file, không bundle. |
| `browser-automation` | scrape, crawl, headless, automate browser, screenshot | playwright/puppeteer (optional) | Tách khỏi web-testing: tập trung scrape, không phải test. |

Cập nhật `skills/registry.md` thêm bảng “Domain” phía sau “Project”. Cập nhật `intent-classifier` examples (nằm trong `skills/orchestrator/references/`) để các trigger này route đúng.

Acceptance:

- `:ck:auto add Stripe checkout` route tới `payment-integration` (test bằng `auto-contract.test.cjs` mở rộng).
- `:ck:auto write playwright tests for login` route tới `web-testing`.
- Không có yêu cầu nào của Phase 3 phá `auto-contract` hiện hành.

### Phase 4 — Docs & DX polish (v2.4.x, P2)

| # | Việc | Output |
|---|---|---|
| 4.1 | `docs/architecture.md` — sơ đồ một trang về luồng `:ck:auto` (Spec → approval → orchestrator → skills → verify → report). | 1 file |
| 4.2 | `docs/compatibility-matrix.md` — bảng ForgeCode/Codex/Claude support level. | 1 file |
| 4.3 | README rút gọn: chỉ giữ Quickstart + link tới `docs/`. | README ≤120 dòng |
| 4.4 | `examples/ck-auto-templates.md` mở rộng cho 6 skill mới — vẫn là plain-language template, không lộ tên skill. | Update |
| 4.5 | GIF/video demo: lưu ngoài repo (release asset hoặc README link tới gist). | Không bloat repo |

---

## 3. Chi tiết các thay đổi rủi ro thấp / cao

### 3.1. Validator pipeline (Phase 1.4 + 2.8–2.11)

Một lệnh `npm run lint` chạy tuần tự:

1. JSON schema check `forgekit.json` (entrypoints == `[":ck:auto"]`).
2. TOML parse `.forge.toml`.
3. Markdown frontmatter check tất cả `skills/**/SKILL.md`.
4. Registry consistency: tên skill trong registry == thư mục thực.
5. Adapter test (đã có) + hooks test (mới).

Mục tiêu: chạy < 5s trên repo này.

### 3.2. Hook runtime — quy ước chung

- Mỗi hook là CommonJS `.cjs`, đọc stdin JSON, ghi stderr nếu cần block, exit code 0 (allow) / 2 (block).
- Không phụ thuộc package npm bên ngoài (giữ attack surface thấp như báo cáo §4.5 khen).
- Đặt `#!/usr/bin/env node` shebang, chmod +x trong installer.
- Mỗi hook có test riêng dùng `child_process.spawnSync`.

### 3.3. Giữ entrypoint duy nhất khi mở rộng skill

Risk: thêm skill có thể khiến contributor thêm slash command hoặc mention tên skill ở user-facing surface.

Mitigation:

- PR template (1.8) có checkbox: “No new user-facing entrypoint besides `:ck:auto`.”
- `validate-forgekit.cjs` (2.8) fail nếu `entrypoints` array ≠ `[":ck:auto"]`.
- README diff guard: CI fail nếu README xuất hiện regex `/^\s*\/ck:` hoặc `/^\s*:ck:(?!auto\b)/`.

---

## 4. Cái dứt khoát KHÔNG làm (drop list)

| Đề xuất từ báo cáo | Lý do từ chối |
|---|---|
| `/ck:plan`, `/ck:cook`, `/ck:fix`, `/ck:test`, `/ck:review`, `/ck:watzup` riêng | Vi phạm §0.1. |
| Statusline runtime kiểu Claudev | Tăng noise; non-tech user không cần. |
| `claudekit-cli` tương đương | Vi phạm §0.3 (user phải hiểu CLI flags). |
| Nhúng demo media trong repo (mp4, mp3, png lớn, fonts) | Vi phạm §0.6. |
| Semantic-release + commitlint + husky | Quá nặng; tag-driven release (1.6) đủ. |
| Plugin marketplace docs | Out of scope phase này. |
| Researcher / brainstormer / journal-writer / project-manager agents | Trùng với planner/docs-manager hiện có; thêm chỉ tăng surface. |
| Statusline/dashboard JS | Không phục vụ flow `:ck:auto`. |

---

## 5. Mapping điểm yếu báo cáo → action

| Báo cáo §  | Điểm yếu | Action | Phase |
|---|---|---|---|
| 5.1 | Skill ít hơn (27 vs 82) | +6 skill domain (auth/payment/web-testing/ai-multimodal/document-processing/browser-automation) | 3 |
| 5.2 | Hook runtime chưa thật | 4 hook `.cjs` thực thi | 2 |
| 5.3 | Thiếu CI/release | GitHub Actions ci.yml + release.yml | 1 |
| 5.4 | Thiếu LICENSE | LICENSE file MIT | 1 |
| 5.5 | Docs chuyên sâu | docs/architecture.md + compatibility-matrix.md | 4 |
| 5.6 | Ít script helper | Validator scripts + hook tests | 2 |
| 5.7 | Claude Code shallow | Giữ mức compatibility export — không nâng cấp (nguyên tắc §0.4) | — |
| §4.7 báo cáo | Test root chưa wire | `npm test` chạy thật | 1 |
| §4.8 báo cáo | Repo sạch | Giữ; thêm guard `.forgeignore` (1.9) | 1 |

---

## 6. Quality gates cho mọi release

Mỗi PR vào `main` phải pass:

1. `npm test` ≥ tất cả test hiện tại + test mới (hook, contract, adapter).
2. `npm run lint` (validators §3.1).
3. CI (Node 18 + 20).
4. Adapter test khẳng định `:ck:auto` vẫn là entrypoint duy nhất (`auto-contract.test.cjs` mở rộng).
5. README guard: không xuất hiện slash command user-facing mới.
6. PR description tick đủ checkbox §0.

---

## 7. Ước lượng & thứ tự thực thi

| Phase | Effort thô | Phụ thuộc | Có thể merge độc lập |
|---|---|---|---|
| 1 | ~0.5 ngày | — | ✅ |
| 2 | ~1 ngày | Phase 1 (CI để chạy hook test) | ✅ sau Phase 1 |
| 3 | ~1.5 ngày | Phase 2 (validator để gate skill mới) | ✅ sau Phase 2 |
| 4 | ~0.5 ngày | Phase 1–3 | ✅ cuối |

Tổng: ~3.5 ngày người, chia làm 4 PR tuần tự, mỗi PR ra một version npm.

---

## 8. Rủi ro & mitigation

| Rủi ro | Mitigation |
|---|---|
| Contributor thêm `/ck:something` để “tiện” | PR template + validate-forgekit.cjs gate |
| Thêm skill làm tăng token nền dù chỉ load on-demand | `validate-skills.cjs` cap `SKILL.md` ≤150 dòng; references không tự load |
| Hook runtime vỡ trên Windows | Kiểm với `process.platform`, fallback `.cmd` shim trong installer nếu cần |
| `npm publish` accidental từ CI | `release.yml` chỉ trigger khi tag `v*`, secret `NPM_TOKEN` scope hẹp |
| Người dùng non-tech bối rối vì hook block | Block message luôn kèm “bạn cần làm gì tiếp”, không panic stack trace |

---

## 9. Bước kế tiếp đề xuất

Khi user duyệt plan này, mở PR theo thứ tự:

1. PR-1: Phase 1 (LICENSE, CHANGELOG, npm test thật, CI, lint, PR template).
2. PR-2: Phase 2 (4 hook `.cjs` + validators + hook tests).
3. PR-3: Phase 3 (6 skill mới + registry + intent-classifier examples + ck-auto templates).
4. PR-4: Phase 4 (docs + compatibility matrix + README polish).

Mỗi PR yêu cầu xác nhận §0 trước khi merge.
