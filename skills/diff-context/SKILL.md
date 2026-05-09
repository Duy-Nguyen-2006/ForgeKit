---
name: ck:diff-context
description: >
  Load minimal context từ git diff cho fix/refactor tasks. Chỉ load
  changed files + reverse deps thay vì scan toàn bộ codebase.
  Pattern từ Continue.dev @diff provider và OpenHands git_changes.
argument-hint: "[--base=REF] [--scope=files|deps|all]"
metadata:
  author: forgekit
  version: "1.0.0"
  inspired-by:
    - "Continue.dev @diff context provider"
    - "OpenHands git_changes microagent"
---

# Diff Context

Load minimal context cho fix/refactor/patch tasks từ git diff thay vì toàn codebase.

## Khi nào load skill này

- Fix bug, refactor, patch — task có git history
- Cần hiểu change impact mà không scan cả repo
- Task type: fix, refactor, patch, hotfix, cherry-pick
- User nhắc "diff", "changed files", "what changed"
- `ck:fix` hoặc `ck:code-review` cần context hẹp

## KHÔNG dùng khi

- Task greenfield (không có git history liên quan)
- Task cần hiểu toàn bộ architecture (dùng `ck:context-engineering`)
- Repo mới chưa có commits

## Workflow

### Step 1: Get Diff

```bash
# Staged + unstaged changes
git diff HEAD
# Hoặc so với branch cụ thể
git diff main...HEAD
# Chỉ file names
git diff --name-only HEAD
```

Nếu `--base=REF` được cung cấp: `git diff <REF>...HEAD`

**Output:** `✓ Step 1: Diff captured - [N] files changed, [+X/-Y] lines`

### Step 2: Extract Changed Files

Parse `git diff --name-only` → danh sách file paths.

Lọc bỏ:
- Lock files (package-lock, yarn.lock, pnpm-lock)
- Generated files (*.min.js, *.generated.*, dist/)
- Vendor/third-party

**Output:** `✓ Step 2: [M] changed files identified`

### Step 3: Find Reverse Dependencies

Cho mỗi changed file, tìm files phụ thuộc vào nó. Chi tiết tại `references/reverse-deps-strategies.md`.

**Ưu tiên strategy:**

| Priority | Strategy | Khi nào dùng |
|----------|----------|-------------|
| 1 | Serena `find_referencing_symbols` | MCP có sẵn, codebase có LSP index |
| 2 | ast-grep AST reference search | Cần precise, có ast-grep installed |
| 3 | ripgrep import/require tracing | Fallback universal, nhanh |
| 4 | tree-sitter local symbol index | Cần offline symbol index |

**Output:** `✓ Step 3: [K] reverse dependencies found`

### Step 4: Load Minimal Context

Chỉ đọc:
1. **Changed files** (từ Step 2) — toàn bộ nội dung
2. **Reverse dep files** (từ Step 3) — chỉ phần liên quan (hunk context)
3. **Diff summary** (từ Step 1) — cho overview

KHÔNG đọc:
- Files không liên quan
- Toàn bộ directory listing
- Full codebase map

**Scope flag:**
- `--scope=files` → chỉ changed files (không reverse deps)
- `--scope=deps` → chỉ reverse deps (không changed files)
- `--scope=all` → cả hai (default)

**Output:** `✓ Step 4: Context loaded - [M] changed + [K] deps = [T] total files`

### Step 5: Build Context Window

Assemble thành context window cho agent:

```
## Diff Summary
[git diff --stat output]

## Changed Files
### path/to/changed-file.ts
[full content]

## Reverse Dependencies
### path/to/dep-file.ts (references: changed-file.ts)
[relevant hunk or full if small]
```

**Output:** `✓ Step 5: Context window built - ~[N] tokens`

## Token Budget

| Phase | Max tokens |
|-------|-----------|
| Step 1-2: Diff + file list | ≤ 500 |
| Step 3: Reverse deps | ≤ 1000 |
| Step 4-5: Load + build | ≤ 5000 (total context) |
| **Total** | **≤ 6500** |

Nếu vượt budget:
1. Ưu tiên changed files > reverse deps
2. Với reverse deps: chỉ load hunk context, không load full file
3. Nếu vẫn vượt: hỏi user refine scope

## Fallback khi không có git

- Không có git repo → route sang `ck:context-engineering`
- Không có Serena → dùng ripgrep (Step 3, strategy 3)
- Không có diff (clean working tree) → check `git log -1` cho last commit, hoặc hỏi user

## So sánh với full-codebase approach

| | Full codebase scan | Diff context |
|--|-------------------|-------------|
| Token cost | 20K-100K+ | 3K-7K |
| Speed | Chậm | Nhanh |
| Accuracy | Rộng nhưng noise | Focus, ít noise |
| Best for | Architecture tasks | Fix/refactor tasks |

## Integration với skills khác

- `ck:fix` → load diff-context ở Step 1 (Scout)
- `ck:code-review` → load diff-context cho review scope
- `ck:context-engineering` → fallback khi diff-context không applicable
- `ck:git` → cung cấp git operations cần thiết

## Output Format

```
✓ Step 1: Diff captured - [N] files, [+X/-Y] lines
✓ Step 2: [M] changed files identified
✓ Step 3: [K] reverse dependencies found
✓ Step 4: Context loaded - [M] changed + [K] deps = [T] total
✓ Step 5: Context window built - ~[N] tokens
```

## References

- `references/diff-workflow.md` - Chi tiết từng bước workflow + fallback
- `references/reverse-deps-strategies.md` - 4 strategies tìm reverse dependencies
