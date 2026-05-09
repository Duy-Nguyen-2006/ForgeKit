---
name: ck:repo-map
description: >
  Generate a token-efficient repo skeleton map ranked by importance.
  Use for large codebases, orientation, understanding project structure
  without reading full files. Replaces reading entire files when exploring.
argument-hint: "[path-to-repo-or-directory]"
triggers:
  - repo map
  - folder structure
  - project structure
  - sơ đồ project
  - skeleton map
  - repomap
non_triggers:
  - read file content
  - symbol search
  - code implementation
examples:
  - "map repo structure"
  - "sơ đồ project này có gì"
  - "xem folder layout project"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Repo Map

Tạo skeleton map gọn (~2-5k tokens) chứa class/function signatures quan trọng nhất, rank theo PageRank connectivity. Thay thế việc đọc full file khi explore codebase.

## Khi nào dùng

- Repo lớn (>50 files), chưa quen structure
- Cần orient nhanh: "project này có gì, ở đâu"
- Thay vì đọc 10+ files để hiểu architecture
- Khi `context-engineering` cần overview trước khi đi sâu
- Cross-file refactor: cần biết dependency graph

## Khi nào KHÔNG dùng

- Repo nhỏ (<20 files): đọc trực tiếp nhanh hơn
- Đã biết rõ file cần sửa: dùng `read` trực tiếp
- Cần nội dung implementation chi tiết: map chỉ có signatures

## Workflow

### 1. Check Cache

```
.forge/cache/repo-map.json
```

Nếu cache tồn tại và không file nào thay đổi (mtime check): dùng cache, skip bước 2-4.

### 2. Detect Language & Choose Engine

| Engine | Ưu tiên | Khi nào |
|---|---|---|
| tree-sitter CLI | 1 | Có cài, hỗ trợ grammar cho ngôn ngữ |
| ast-grep | 2 | Có cài, nhiều ngôn ngữ, pattern-based |
| ts-morph | 3 | TypeScript/JavaScript project |
| ripgrep heuristic | 4 | Fallback cuối, không cần AST |

Chi tiết: `references/aider-repomap-technique.md` và `references/fallback-methods.md`

### 3. Generate Skeleton

**Core technique (Aider repomap):**

1. Parse AST → extract definitions (class, function, method, interface, type)
2. Build reference graph: symbol A references symbol B → edge A→B
3. Run PageRank on graph → rank symbols by connectivity
4. Keep top-N symbols (target ~2-5k tokens output)
5. Output: file path + ranked signatures only

**Quick method với shell:**

```bash
# tree-sitter: extract definitions
tree-sitter parse <file> | extract named nodes at depth 1-2

# ast-grep: pattern-based extraction
ast-grep --pattern 'class $NAME { $$$ }' --pattern 'function $NAME($$$) { $$$ }' --json

# ripgrep fallback: heuristic
rg -n '^\s*(export\s+)?(class|function|interface|type|const|def|fn)\s+\w+' --glob '*.{ts,tsx,js,py,rs,go}'
```

### 4. Rank & Prune

```
ranking = pagerank(reference_graph)
output = top_N_symbols(ranking, budget=5000_tokens)
```

Heuristic đơn giản (không cần PageRank library):
1. Đếm incoming references cho mỗi symbol
2. Sort descending
3. Keep top symbols cho đến khi đạt token budget

### 5. Format Output

```
src/
  auth/
    service.ts:
      ┃ class AuthService  ← 12 refs
      ┃   login(credentials): Promise<Token>
      ┃   validateSession(token): Promise<User>
      ┃   revokeSession(token): void
    middleware.ts:
      ┃ function requireAuth(req, res, next)  ← 8 refs
  api/
    routes.ts:
      ┃ const router = Router()
      ┃ router.post('/login', loginHandler)  ← 3 refs
```

- `← N refs`: số incoming references (importance indicator)
- Chỉ signatures, không body
- Files grouped theo directory structure
- Token budget: 2-5k tokens

### 6. Cache Result

Save to `.forge/cache/repo-map.json`:

```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "file_mtimes": {"src/auth/service.ts": 1704067200, ...},
  "map_content": "...",
  "token_count": 3200,
  "engine_used": "tree-sitter"
}
```

Invalidation: nếu bất kỳ source file có mtime mới hơn timestamp → regenerate.

## Token Rules

- Target output: **2-5k tokens** cho repo map
- Repo < 100 files: ~2k tokens
- Repo 100-500 files: ~3k tokens
- Repo > 500 files: ~5k tokens
- Nếu map vượt budget: tăng prune threshold (chỉ giữ symbols với refs ≥ 2)
- **Không** inject map vào context nếu không cần — chỉ generate khi hỏi hoặc orient

## Integration với Skills Khác

| Skill | Mối quan hệ |
|---|---|
| `context-engineering` | repo-map cung cấp overview, context-eng đi sâu |
| `scout` | scout tìm files cụ thể, repo-map cho big picture |
| `repomix` | repomix = full dump, repo-map = skeleton ranked |
| `token-efficiency` | repo-map tuân thủ token budget rules |

## Quick Commands

```bash
# Check tree-sitter availability
tree-sitter --version 2>/dev/null

# Check ast-grep availability
ast-grep --version 2>/dev/null || sg --version 2>/dev/null

# Quick skeleton with ripgrep (universal fallback)
rg -n '^\s*(export\s+)?(class|function|interface|type|const|def|fn|impl|pub)\s+\w+' <dir>

# Count refs for ranking
rg -c 'import.*AuthService\|AuthService\.' <dir>
```

## References

- `references/aider-repomap-technique.md` - Chi tiết kỹ thuật tree-sitter + PageRank
- `references/fallback-methods.md` - Alternative methods khi tree-sitter không available
