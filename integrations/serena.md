# Serena MCP Integration

Status: recommended, optional runtime dependency.

Use when:

- large or unfamiliar codebase
- symbol lookup needed
- find references/usages needed
- safe cross-file refactor needed
- regex search is too broad

Avoid when:

- one obvious file
- simple config/doc edit
- Serena not installed

## Setup

### Option 1: Upstream installer (recommended)

```bash
# Install via uvx (Python package runner)
uvx --from git+https://github.com/oraios/serena serena-mcp-server

# Or install globally with pip
pip install git+https://github.com/oraios/serena
```

### Option 2: ForgeCode MCP config

```bash
serena --version
serena project health-check <project_path>

# Import into ForgeCode — use the installed path
forge mcp import --scope user '{"mcpServers":{"serena":{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server","--context=ide","--project","<project_path>"]}}}'
forge mcp reload
```

### Option 3: Local install path

```bash
# If installed locally, use direct path
forge mcp import --scope user '{"mcpServers":{"serena":{"command":"/home/duy/.local/bin/serena","args":["start-mcp-server","--context=ide","--project","<project_path>"]}}}'
forge mcp reload
```

1. Copy file MCP config:
   ```sh
   cp .mcp.json.example .mcp.json
   ```
2. ForgeCode đọc `.mcp.json` khi start — Serena tự available.

## Tool Reference (Serena MCP)

Serena MCP provides these tools. **Use these exact names** — older names like `symbol_lookup`, `find_references`, `workspace_symbols` are deprecated and will fail.

| Tool | Purpose | When to use |
|---|---|---|
| `find_symbol` | Find symbol definition by name | Need to locate a class, function, variable definition |
| `find_referencing_symbols` | Find all symbols that reference a given symbol | Need to know who calls/uses a function or class |
| `get_symbols_overview` | Get overview of all symbols in a file or project | Need a map of what's defined where |
| `search_for_pattern` | Regex/semantic pattern search across codebase | Need flexible search beyond exact symbol names |

ForgeKit rule: ForgeCode native first; Serena second for semantic code intelligence.

## Khi nào agent dùng Serena vs native

| Task | Tool |
|---|---|
| Tìm function/class definition | Serena: `find_symbol` |
| Ai gọi function này | Serena: `find_referencing_symbols` |
| Cross-file refactor | Serena: `get_symbols_overview` + `find_referencing_symbols` |
| Regex/semantic search | Serena: `search_for_pattern` |
| Đọc file nhỏ, rõ path | native read |
