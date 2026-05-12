# GitNexus MCP Integration

Status: recommended, optional runtime dependency.

Use when:

- large or unfamiliar codebase
- symbol lookup needed
- find references/usages needed
- cross-file impact unclear
- safe rename/refactor needed

Avoid when:

- one obvious file
- simple config/doc edit
- GitNexus not installed or repo not indexed

## Setup

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@rc", "mcp"]
    }
  }
}
```

Quick start: `cp .mcp.json.example .mcp.json` — ForgeCode auto-detects `.mcp.json` on start.

## Tool Reference

| Tool | Purpose | When to use |
|---|---|---|
| `query` | Find execution flows and related symbols | Need repo overview for a concept |
| `context` | Inspect one symbol with callers/callees | Need precise symbol context |
| `impact` | Analyze blast radius before changes | Refactor or shared code change |
| `detect_changes` | Map uncommitted changes to affected flows | Pre-commit/PR validation |
| `rename` | Graph-backed rename preview/apply | Multi-file rename |

ForgeKit rule: ForgeCode native first; GitNexus second for graph-backed code intelligence.
