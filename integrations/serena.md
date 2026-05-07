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

Commands:

```bash
serena --version
serena project health-check <project_path>
forge mcp import --scope user '{"mcpServers":{"serena":{"command":"/home/duy/.local/bin/serena","args":["start-mcp-server","--context=ide","--project","<project_path>"]}}}'
forge mcp reload
```

ForgeKit rule: ForgeCode native first; Serena second for semantic code intelligence.

## Setup

1. Copy file MCP config:
   ```sh
   cp .mcp.json.example .mcp.json
   ```
2. ForgeCode đọc `.mcp.json` khi start — Serena tự available.

## Khi nào agent dùng Serena vs native

| Task | Tool |
|---|---|
| Tìm function/class definition | Serena: symbol_lookup |
| Ai gọi function này | Serena: find_references |
| Cross-file refactor | Serena: workspace_symbols |
| Đọc file nhỏ, rõ path | native read |
