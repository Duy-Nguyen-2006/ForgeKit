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
