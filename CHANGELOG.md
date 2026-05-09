# Changelog

All notable changes to ForgeKit are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.4.0] - 2026-05-09

### Added

- `skills/auth/SKILL.md` — authentication & authorization patterns (JWT, OAuth, session, RBAC, OWASP-light checklist).
- `skills/payment-integration/SKILL.md` — payment integration patterns (Stripe, PayPal, MoMo, VNPay, subscriptions).
- `skills/web-testing/SKILL.md` — E2E & browser testing patterns (Playwright, Cypress, visual regression).
- `skills/ai-multimodal/SKILL.md` — AI/multimodal integration patterns (OpenAI, Anthropic, Gemini, vision, embedding, RAG).
- `skills/document-processing/SKILL.md` — document processing patterns (PDF, DOCX, XLSX, PPTX parse/generate).
- `skills/browser-automation/SKILL.md` — browser automation & web scraping patterns (Playwright, Puppeteer).
- `skills/auth/references/auth-checklist.md` — detailed auth implementation guide (loaded on demand).
- `skills/registry.md` — added "Domain" section with 6 new skills.
- `skills/orchestrator/references/intent-classifier.md` — added 18 few-shot examples + 5 ambiguity resolution patterns for domain skills.
- `examples/ck-auto-templates.md` — added 6 new request templates for domain skills (auth, payment, web-testing, AI, document, browser).

### Changed

- All new skills are loaded on-demand only, never by default.
- No user-facing entrypoint changes — all routing is internal via orchestrator.

## [2.3.0] - 2026-05-09

### Added

- `hooks/privacy/privacy-block.cjs` — executable privacy hook (stdin JSON → pattern match → exit 2 on block).
- `hooks/pre-tool/budget-guard.cjs` — executable budget guard hook (token estimation, cap enforcement).
- `hooks/session-start/session-init.cjs` — executable session init hook (one-line git status summary).
- `hooks/notifications/notify.cjs` — executable notification hook (Telegram/Discord/Slack via env vars, disabled by default).
- `forgekit.json` hooks now point to `.cjs` files; `.md` docs kept alongside as `docs` field.
- `hooks/privacy/patterns.json` updated: JS-compatible regex patterns with `pattern_flags` field.
- `skills/auto/scripts/hooks.test.cjs` — 13 hook tests with mock input and exit code assertions.
- Installer (`bin/lgmmo-forgekit-installer.js`) now sets executable bit on `.cjs` hook files (Unix/macOS).
- `scripts/validate-forgekit.cjs` enhanced: checks patterns, docs, webhookConfig paths in hooks.
- `npm test` now includes hook tests.

### Changed

- `forgekit.json` hooks config: `.md` paths → `.cjs` paths, added `docs` and `patterns` fields.
- `package.json` version bump to 2.3.0.

## [2.2.0] - 2026-05-09

### Added

- `LICENSE` file (MIT) at repository root — `package.json` already declared MIT but the physical file was missing.
- `CHANGELOG.md` following Keep a Changelog format; release notes previously embedded in README migrated here.
- Real `npm test` script that runs all adapter, contract, and auto skill tests via Node (no longer a placeholder).
- `npm run lint` command: validator pipeline for `forgekit.json`, `.forge.toml`, skill registry, and SKILL.md frontmatter.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`): Node 18/20 matrix running `npm test` + `npm run lint` + generator dry-run.
- GitHub Actions release workflow (`.github/workflows/release.yml`): tag-driven `npm publish` on push `v*` tag (requires `NPM_TOKEN` secret).
- `CONTRIBUTING.md`: one-page contributor onboarding guide.
- `CODE_OF_CONDUCT.md`: Contributor Covenant adapted for ForgeKit.
- `.github/PULL_REQUEST_TEMPLATE.md`: PR template with Section 0 (non-negotiable principles) compliance checkboxes.
- `.forgeignore` / `.gitignore` updated: added `.forge-backup-*`, `.codex/`, `.claude/`, `*.tsbuildinfo` patterns.

### Changed

- README trimmed: release notes moved to CHANGELOG, quickstart and links remain.
- `package.json` scripts: `test` now runs full test suite; added `lint`, `test:installer` scripts.

## [2.1.1] - 2026-04-25

### Fixed

- Minor installer path fix for Windows compatibility.

## [2.1.0] - 2026-04-20

### Added

- Fixed Serena MCP tool names (find_symbol, find_referencing_symbols, get_symbols_overview, search_for_pattern).
- `repo-map` skill (Aider repomap pattern, tree-sitter PageRank ranking).
- `diff-context` skill (Continue.dev @diff pattern, git diff + reverse deps).
- `code-map` skill (code2prompt/gitingest fallback when Serena unavailable).
- AST-grep wrapper in `scout` skill (semantic AST search).
- `.forgeignore` with comprehensive ignore patterns.
- `intent-classifier` with 60+ few-shot examples and confidence scoring.
- Confidence gate to orchestrator (gap < 0.15 → ask disambiguation).
- YAML frontmatter triggers/non_triggers/examples to all skill files.
- Prompt caching layout docs (3-tier stable→volatile, 50-70% cache hit).
- `budget-guard` hook (pre-tool-call, phase-based token caps).
- Spec template ≤200 tokens (Mục tiêu, Phạm vi, Cách kiểm tra, Ngoài phạm vi).
- Adjusted `.forge.toml`: token_threshold 60K, retention_window 4, max_sem_search 50.
- `recommended-tools.md` with tiered open-source tool recommendations.

## [2.0.0] - 2026-04-10

### Added

- Rebuilt ForgeKit as a ForgeCode-native, `:ck:auto`-first assistant kit.
- Skill registry routing, context-engineering, non-tech UX skills, RTK/Serena setup, and hooks.
- Optional privacy, notifications, and session-start hook documentation.
- README quickstart, demo flow, and copyable request templates.

## [0.1.1] - 2026-03-20

### Added

- npm badges and quick install documentation.
- Published ForgeKit installer from the GitHub source tree.
- Documented `lgmmo-codex-installer@1.0.12` using `https://api.krouter.net/v1`.

## [0.1.0] - 2026-03-15

### Added

- `npx lgmmo-forgekit-installer` for one-command ForgeKit installation.
- Installs a portable `.forge/` runtime bundle into the current directory or `--target` path.
- Backs up existing files to `.forge-backup-<timestamp>/` unless `--force` is used.
