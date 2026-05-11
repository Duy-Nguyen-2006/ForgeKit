---
name: ck:docs
description: "Documentation management"
auto_load: false
argument-hint: "init|update|summarize"
metadata:
  author: forgekit
  version: "1.0.0"
triggers: ["tài liệu", "README", "docs", "documentation", "guide", "changelog", "viết tài liệu"]
non_triggers: ["fix bug", "implement feature", "deploy", "debug"]
examples: ["write README", "cập nhật tài liệu", "generate API docs"]
---

# Documentation Management

Analyze codebase and manage project documentation through scouting, analysis, and structured doc generation.

**IMPORTANT:** Invoke "/ck:project-organization" skill to organize the outputs.

## Default (No Arguments)

If invoked without arguments, use `AskUserQuestion` to present available documentation operations:

| Operation | Description |
|-----------|-------------|
| `init` | Analyze codebase & create initial docs |
| `update` | Analyze changes & update docs |
| `summarize` | Quick codebase summary |

Present as options via `AskUserQuestion` with header "Documentation Operation", question "What would you like to do?".

## Subcommands

| Subcommand | Reference | Purpose |
|------------|-----------|---------|
| `/ck:docs init` | `references/init-workflow.md` | Analyze codebase and create initial documentation |
| `/ck:docs update` | `references/update-workflow.md` | Analyze codebase and update existing documentation |
| `/ck:docs summarize` | `references/summarize-workflow.md` | Quick analysis and update of codebase summary |

## Routing

Parse `$ARGUMENTS` first word:
- `init` → Load `references/init-workflow.md`
- `update` → Load `references/update-workflow.md`
- `summarize` → Load `references/summarize-workflow.md`
- empty/unclear → AskUserQuestion (do not auto-run `init`)

## Shared Context

Documentation lives in `./docs` directory:
```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
├── deployment-guide.md
├── system-architecture.md
└── project-roadmap.md
```

Use `docs/` directory as the source of truth for documentation.

**IMPORTANT**: **Do not** start implementing code.
