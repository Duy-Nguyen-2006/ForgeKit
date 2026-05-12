# Recommended Tools & Integrations

Open-source tools đã được cộng đồng AI-coding xác thực hiệu quả 2025–2026.

## Đã tích hợp

| Tool | Repository | Status | Dùng cho |
|---|---|---|---|
| GitNexus MCP | gitnexus/gitnexus | ✅ Đã có (sửa tool names) | Symbol lookup, cross-file refactor, semantic code intelligence |
| Repomix | yamadashy/repomix | ✅ Đã có (thêm presets) | Codebase summary, repo → prompt |

## Khuyến nghị tích hợp (theo ROI)

### Tier 1: ROI cao nhất

| Tool | Repository | Dùng cho | Pattern nguồn |
|---|---|---|---|
| ast-grep | ast-grep/ast-grep | Semantic AST search — thay regex fs_search, cực ít noise | OpenHands, Cline, Roo Code |
| Aider repomap | paul-gauthier/aider | Repo skeleton ranked by PageRank — giảm 50-80% token đọc codebase | Aider, ForgeKit repo-map skill |

### Tier 2: ROI cao

| Tool | Repository | Dùng cho | Pattern nguồn |
|---|---|---|---|
| code2prompt | mufeedvh/code2prompt | Fallback summary khi không có GitNexus, token-bounded output | ForgeKit code-map skill |
| gitingest | cyclotruc/gitingest | Repo → prompt nhanh, hỗ trợ URL remote repo | ForgeKit code-map skill |

### Tier 3: Bổ sung

| Tool | Repository | Dùng cho | Pattern nguồn |
|---|---|---|---|
| tree-sitter-cli | tree-sitter/tree-sitter | Local symbol index, cache tại .forge/cache/symbols.json | Aider, Continue.dev |
| ts-morph | dsherret/ts-morph | TypeScript/JavaScript symbol extraction, precise AST | ForgeKit repo-map skill |
| universal-ctags | universal-ctags/ctags | Universal symbol index fallback cho mọi ngôn ngữ | ForgeKit repo-map skill |

## Pattern tham khảo (SKILL.md writing)

| Repository | Pattern học được |
|---|---|
| wshobson/agents | YAML frontmatter với triggers, non_triggers, examples |
| VoltAgent/awesome-claude-code-subagents | Subagent orchestration patterns |
| contains-studio/agents | Skill composition và delegation |
| OpenHands microagents | Budget guard hooks, git_changes context |
| Continue.dev context providers | @diff, @codebase, @docs context engineering |
| BMAD-METHOD | Spec template ≤200 tokens |
| SuperClaude Framework | Compact spec format |

## Cài nhanh

```bash
# ast-grep — semantic code search
npm i -g @ast-grep/ast-grep

# code2prompt — repo summary fallback
pip install code2prompt

# gitingest — quick repo → prompt
pip install gitingest

# tree-sitter — local AST parsing
npm i -g tree-sitter-cli

# universal-ctags — universal symbol index
# macOS: brew install universal-ctags
# Ubuntu: apt install universal-ctags

# GitNexus MCP — semantic code intelligence
uvx --from git+https://github.com/gitnexus/gitnexus gitnexus mcp
```
