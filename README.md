# ForgeKit

[![npm version](https://img.shields.io/npm/v/lgmmo-forgekit-installer.svg)](https://www.npmjs.com/package/lgmmo-forgekit-installer)
[![npm downloads](https://img.shields.io/npm/dm/lgmmo-forgekit-installer.svg)](https://www.npmjs.com/package/lgmmo-forgekit-installer)
[![GitHub repo](https://img.shields.io/badge/GitHub-ForgeKit-181717?logo=github)](https://github.com/Duy-Nguyen-2006/ForgeKit)

ForgeKit is a ForgeCode-native assistant kit for non-technical users.

## Quickstart: 3 steps

1. Open a terminal in your project and install ForgeKit:
   ```bash
   npx lgmmo-forgekit-installer
   ```
2. Open ForgeCode in the same folder and ask for what you want:
   ```text
   :ck:auto build me a todo app
   ```
3. Read the Spec, approve it, then ForgeKit implements, verifies, and reports the result.

If you are not technical, start with plain language. You do not need to choose skills or tools.

## Example Requests

Copy one and customize it:

```text
:ck:auto build me a clean landing page for my coffee shop
:ck:auto fix the login bug where users cannot sign in
:ck:auto refactor this large dashboard module without changing behavior
:ck:auto add a Stripe checkout flow for monthly subscriptions
:ck:auto review this project and tell me what is broken
```

For more copyable templates, see [`examples/ck-auto-templates.md`](examples/ck-auto-templates.md).

## 30-second Demo Flow

```text
User: :ck:auto build me a todo app
ForgeKit: writes a short Spec in Vietnamese
User: đúng, làm đi
ForgeKit: routes to the right skill, edits files, runs verification
ForgeKit: reports changed files + how to test
```

For a video/GIF, record this exact flow in ForgeCode; no extra setup is required.

Primary user flow:

```text
:ck:auto <what you want built or fixed>
```

The assistant writes a Spec, waits for approval, then routes work to the smallest useful skill/tool set, implements, verifies, and reports.

## Design Goals

- ForgeCode native first.
- One public entrypoint: `:ck:auto`.
- Spec-first with one approval gate.
- Token-efficient skill loading.
- Non-technical user experience.
- Optional adapters for Codex and Claude.
- Optional RTK and Serena MCP integration.
- No context-mode and no cavemem.

## Repository Layout

```text
ForgeKit/
├── forgekit.json
├── AGENTS.md
├── .forge.toml
├── commands/ck:auto.md
├── agents/
├── skills/
│   ├── auto/
│   ├── orchestrator/
│   ├── token-efficiency/
│   └── ...
├── integrations/
│   ├── rtk.md
│   └── serena.md
├── hooks/
│   ├── privacy/
│   ├── notifications/
│   └── session-start/
├── communication/caveman.md
└── scripts/
    ├── generate-forgecode.py
    ├── generate-codex.py
    └── generate-claude.py
```

## ForgeCode Native Setup

ForgeCode is the primary runtime.

### Option A — One-command install with npm

For non-technical users, install ForgeKit into the current project directory:

```bash
npx lgmmo-forgekit-installer
```

Or install into a specific directory:

```bash
npx lgmmo-forgekit-installer --target ./my-project
```

This creates a portable `.forge/` runtime bundle:

```text
.forge/
├── forgekit.json
├── AGENTS.md
├── .forge.toml
├── .mcp.json.example
├── commands/
├── agents/
├── skills/
├── integrations/
├── hooks/
└── communication/
```

If existing files are present, the installer backs them up to `.forge-backup-<timestamp>/`. To replace without backup:

```bash
npx lgmmo-forgekit-installer --force
```

After install, open ForgeCode in that directory and use:

```text
:ck:auto <what you want built or fixed>
```

### Option B — Use this repo directly

Clone or place this repo at:

```text
~/ForgeKit
```

Then point ForgeCode to the kit root or copy these files into your ForgeCode runtime as needed:

```text
forgekit.json
.forge.toml
AGENTS.md
commands/
agents/
skills/
integrations/
communication/
```

The native command is:

```text
:ck:auto
```

Do not use `/ck:auto` as the native ForgeCode command. Slash commands are compatibility syntax for other runtimes.

### Option C — Generate `.forge/` runtime export

From the repo root:

```bash
python3 scripts/generate-forgecode.py --force
```

This creates:

```text
.forge/
├── forgekit.json
├── AGENTS.md
├── commands/
├── agents/
├── skills/
├── integrations/
├── hooks/
└── communication/
```

Use `.forge/` as a portable ForgeCode runtime bundle.

## Codex Setup

Codex is supported as a compatibility export. The published `lgmmo-codex-installer@1.0.12` configures Codex against:

```text
https://api.krouter.net/v1
```

Run:

```bash
npx lgmmo-codex-installer@latest
```

Manual export path:

Generate Codex files:

```bash
python3 scripts/generate-codex.py --force
```

This creates:

```text
.codex/
├── codex.json
└── skills/
```

For Codex, expose the workflow as:

```text
/ck:auto <what you want>
```

Codex should read:

```text
AGENTS.md
.codex/skills/auto/SKILL.md
.codex/skills/orchestrator/SKILL.md
.codex/skills/token-efficiency/SKILL.md
```

## Claude Setup

Claude is supported as a compatibility export.

Generate Claude files:

```bash
python3 scripts/generate-claude.py --force
```

This creates:

```text
.claude/
├── CLAUDE.md
├── commands/ck/auto.md
└── skills/
```

For Claude, expose the workflow as:

```text
/ck:auto <what you want>
```

Claude should read `.claude/CLAUDE.md` as the top-level instruction file.

## Token Efficiency Rules

ForgeKit uses a thin-entry/deep-reference model:

```text
SKILL.md = short routing and rules
references/ = detailed guidance loaded only when needed
scripts/ = concrete helpers, tests, adapters
```

Default routing policy:

1. ForgeCode native tools first.
2. Targeted search/read before broad scouting.
3. Load at most one primary skill initially.
4. Load references only when the task needs them.
5. Use RTK for noisy shell output when installed.
6. Use Serena MCP for large codebases, symbols, usages, and refactors when installed.
7. Do not use context-mode.
8. Do not use cavemem.

## Optional Integrations

### RTK

Use RTK for long shell/test/build/diff output.

See:

```text
integrations/rtk.md
```

### Serena MCP

Use Serena MCP for large codebases, symbol lookup, find usages, and cross-file refactors.

See:

```text
integrations/serena.md
```

## Verification

Run structural tests:

```bash
node skills/auto/scripts/forgecode-adapter.test.cjs
node skills/auto/scripts/codex-adapter.test.cjs
node skills/auto/scripts/claude-adapter.test.cjs
```

Expected result: all tests pass.

## Release Notes

### 2.0.0

- Rebuilt ForgeKit as a ForgeCode-native, `:ck:auto`-first assistant kit.
- Added skill registry routing, context-engineering, non-tech UX skills, RTK/Serena setup, and hooks.
- Added optional privacy, notifications, and session-start hook documentation.
- Added README quickstart, demo flow, and copyable request templates.

### 0.1.1

- Added npm badges and quick install documentation.
- Published ForgeKit installer from the GitHub source tree.
- Documented `lgmmo-codex-installer@1.0.12` using `https://api.krouter.net/v1`.

### 0.1.0

- Added `npx lgmmo-forgekit-installer` for one-command ForgeKit installation.
- Installs a portable `.forge/` runtime bundle into the current directory or `--target` path.
- Backs up existing files to `.forge-backup-<timestamp>/` unless `--force` is used.

## Security

Do not commit runtime/private files:

```text
.credentials.json
.forge.db*
.forge_history
cache/
snapshots/
.env
.env.*
```

`AGENTS.md` in this repo is sanitized and must not contain plaintext secrets.
