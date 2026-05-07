# ForgeKit

ForgeKit is a ForgeCode-native assistant kit for non-technical users.

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
├── communication/caveman.md
└── scripts/
    ├── generate-forgecode.py
    ├── generate-codex.py
    └── generate-claude.py
```

## ForgeCode Native Setup

ForgeCode is the primary runtime.

### Option A — Use this repo directly

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

### Option B — Generate `.forge/` runtime export

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
└── communication/
```

Use `.forge/` as a portable ForgeCode runtime bundle.

## Codex Setup

Codex is supported as a compatibility export.

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
