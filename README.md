# ForgeKit

[![npm version](https://img.shields.io/npm/v/lgmmo-forgekit-installer.svg)](https://www.npmjs.com/package/lgmmo-forgekit-installer)
[![CI](https://github.com/Duy-Nguyen-2006/ForgeKit/actions/workflows/ci.yml/badge.svg)](https://github.com/Duy-Nguyen-2006/ForgeKit/actions/workflows/ci.yml)
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

## Design Goals

- ForgeCode native first.
- One public entrypoint: `:ck:auto`.
- Spec-first with one approval gate.
- Token-efficient skill loading.
- Non-technical user experience.
- Optional adapters for Codex and Claude.
- Optional RTK and Serena MCP integration.

## Setup

### Option A — One-command install with npm

```bash
npx lgmmo-forgekit-installer
```

Or install into a specific directory:

```bash
npx lgmmo-forgekit-installer --target ./my-project
```

After install, open ForgeCode in that directory and use:

```text
:ck:auto <what you want built or fixed>
```

### Option B — Use this repo directly

Clone or place this repo at `~/ForgeKit`, then point ForgeCode to the kit root.

### Option C — Generate `.forge/` runtime export

```bash
python3 scripts/generate-forgecode.py --force
```

## Codex / Claude Compatibility

- **Codex**: `npx lgmmo-codex-installer@latest` or `python3 scripts/generate-codex.py --force`
- **Claude**: `python3 scripts/generate-claude.py --force`

For Codex/Claude, use `/ck:auto <what you want>` (slash syntax).

## Verification

```bash
npm test          # Run all tests
npm run lint      # Validate forgekit.json, registry, SKILL.md
```

## Docs

- [CHANGELOG.md](CHANGELOG.md) — Release history
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute
- [examples/ck-auto-templates.md](examples/ck-auto-templates.md) — Request templates

## Security

Do not commit runtime/private files: `.credentials.json`, `.forge.db*`, `.env`, `.env.*`.
