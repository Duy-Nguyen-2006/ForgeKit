# ForgeKit Architecture

Sơ đồ một trang về luồng `:ck:auto` — từ yêu cầu user tới kết quả cuối cùng.

## Flow tổng thể

```text
User
  │
  ▼
:ck:auto <yêu cầu>
  │
  ▼
┌──────────────────────┐
│  Spec Gate           │
│  Draft Spec (≤200 tk)│
│  Wait for approval   │
└──────────┬───────────┘
           │ User approves
           ▼
┌──────────────────────┐
│  Orchestrator        │
│  Intent classification│
│  Confidence scoring  │
│  Skill routing       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Skill Execution     │
│  Load min skill set  │
│  Implement safely    │
│  Token budget guard  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Verification        │
│  Run tests/lint      │
│  Fix failures        │
│  Re-verify if needed │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Final Report        │
│  Vietnamese concise  │
│  Changed files list  │
│  How to test         │
└──────────────────────┘
```

## Component Responsibilities

### `:ck:auto` (Command + SKILL.md)
- Single user-facing entrypoint
- Enforces Spec Gate: no file edits, no implementation commands before approval
- Approval keywords: `Đúng, làm đi` / `OK` / `Approved` / `Proceed`
- After approval: delegates to orchestrator

### Orchestrator (skills/orchestrator/SKILL.md)
- Reads `skills/registry.md` for routing table
- Uses `intent-classifier.md` for few-shot routing (60+ examples)
- Confidence scoring: verb > noun, gap ≥ 0.15 → direct route
- Tie-breaking: dynamic verb determines primary skill
- Routes to minimum skill set (1 primary, 0-N secondary)

### Token Efficiency (skills/token-efficiency/SKILL.md)
- Thin-entry/deep-reference model: SKILL.md = routing, references/ = depth
- Max 1 primary skill initially
- Prompt caching: stable context first, volatile last
- Budget guard hook: caps per-tool token reads (4K/8K/12K by phase)
- Disabled: context-mode, cavemem

### Hooks (hooks/)
- **privacy-block.cjs**: redacts secrets in final output (pattern match → exit 2)
- **budget-guard.cjs**: blocks excessive token reads (estimate → cap check → downgrade/chunk/warn)
- **session-init.cjs**: one-line git status on session start
- **notify.cjs**: Telegram/Discord/Slack notifications (disabled by default)
- Convention: CommonJS, stdin JSON, exit 0 (allow) / 2 (block), no npm deps

### Validators (scripts/)
- `validate-forgekit.cjs`: schema check, entrypoints == [`:ck:auto`], behavior flags
- `validate-registry.cjs`: registry entries → SKILL.md exists, frontmatter has triggers
- `validate-skills.cjs`: SKILL.md line count, cross-reference check

### Generators (scripts/)
- `generate-forgecode.py` → `.forge/` (native runtime)
- `generate-codex.py` → `.codex/` (compatibility layer)
- `generate-claude.py` → `.claude/` (compatibility layer)

### Installer (bin/)
- `npx lgmmo-forgekit-installer` → copies into `.forge/` in target project
- Backs up existing files, sets executable bit on `.cjs` hooks

## Data Flow

```text
forgekit.json ──→ Validators (npm run lint)
     │
     ├── entrypoints: [":ck:auto"]  ← enforced by validate-forgekit.cjs
     ├── skillRegistry ──→ validate-registry.cjs
     └── hooks ──→ .cjs runtime + .md docs

skills/registry.md ──→ Orchestrator reads at runtime
     │
     ├── Core (always loaded)
     ├── Development / Operations / Quality / Project
     └── Domain (on-demand only): auth, payment, web-testing, ai-multimodal, document-processing, browser-automation

skills/orchestrator/references/intent-classifier.md ──→ 78+ few-shot examples
     │
     ├── Confidence scoring rules
     ├── 12 ambiguity resolution patterns
     └── Vietnamese intent patterns
```

## Quality Gates

Every PR to `main` must pass:
1. `npm test` — all adapter + contract + hook tests
2. `npm run lint` — validator pipeline
3. CI (Node 18 + 20 matrix)
4. `auto-contract.test.cjs` — `:ck:auto` is sole entrypoint
5. README guard — no new `/ck:` commands
6. PR template — Section 0 compliance checkboxes ticked
