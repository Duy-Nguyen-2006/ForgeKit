# ForgeKit Runtime Rules

- ForgeCode native first.
- User entrypoint: `:ck:auto`.
- Spec first, one approval gate, autonomous after approval.
- No plaintext secrets in this file.
- Prefer targeted search/read before broad scouting.
- Use RTK for long shell output when installed.
- Use GitNexus MCP for large codebases, symbols, references, refactors when installed.
  - Prefer `query`, `context`, `impact`, `detect_changes`, and `rename` for graph-backed code intelligence.
- Use `repo-map` skill for codebase skeleton (Aider repomap pattern) before reading full files.
- Use `diff-context` skill for fix/refactor tasks — load only git diff + reverse deps.
- Use `code-map` skill as fallback when GitNexus is unavailable.
- Use `ast-grep` for semantic AST search (via scout skill) instead of regex `fs_search` when available.
- Respect `.forgeignore` patterns for all codebase scanning operations.
- Prompt caching: place stable context (AGENTS.md, SKILL.md) at top, volatile (todos, diff) at bottom.
- Budget guard: if a tool call would read >8K tokens, prefer GitNexus `query`/`context` or chunk.
- Do not use context-mode in this kit.
- Use concise Vietnamese output by default; keep technical names/paths/commands exact.
- Spec template: use fixed ≤200-token format (Mục tiêu, Phạm vi, Cách kiểm tra, Ngoài phạm vi).
