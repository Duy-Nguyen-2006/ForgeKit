# gitingest Guide

gitingest (cyclotruc/gitingest) — CLI tool chuyển any git repo thành structured summary, hỗ trợ cả local và remote repos.

## Installation

```bash
# pip (global)
pip install gitingest

# pipx (isolated, recommended)
pipx install gitingest

# Verify
gitingest --version
```

## Basic Usage

### Local repo

```bash
# Generate summary of current directory
gitingest .

# Specify subdirectory only
gitingest ./src

# Output to file
gitingest . > docs/codebase-summary.md
```

### Remote repo (URL mode)

```bash
# GitHub repo
gitingest https://github.com/user/repo

# Specific branch or tag
gitingest https://github.com/user/repo/tree/v1.0.0

# Specific subdirectory
gitingest https://github.com/user/repo/tree/main/src
```

## Key Options

| Option | Description | Default |
|---|---|---|
| (positional) | Path to local dir or remote URL | `.` |
| `--output` | Output file path | stdout |
| `--max-file-size` | Max file size to include (bytes) | 100KB |
| `--exclude-pattern` | Glob patterns to exclude | built-in defaults |
| `--include-pattern` | Glob patterns to include | all |

> **Note:** gitingest API có thể thay đổi giữa versions. Chạy `gitingest --help` để xem options hiện tại.

## Output Structure

gitingest output 3 phần:

1. **Summary** — project overview, file count, total size
2. **Directory tree** — visual tree structure
3. **File contents** — full content của từng file (truncated theo max-file-size)

Ví dụ:

```
========================================
Repository: my-project
Files analyzed: 42
Total tokens: ~12,500
========================================

Directory structure:
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   └── lib/
├── package.json
└── tsconfig.json

========================================
File contents:
========================================

--- src/app/page.tsx ---
(file content here)

--- package.json ---
(file content here)
```

## Token Limiting

gitingest không có built-in `--tokens` flag như code2prompt. Giải pháp:

### Option 1: Pipe + truncate

```bash
# Generate và đếm tokens (~4 chars per token)
gitingest . | head -c 16000 > docs/codebase-summary.md
```

### Option 2: Exclude lớn, include nhỏ

```bash
# Chỉ include source files
gitingest . --include-pattern "*.ts,*.tsx,*.py,*.json,*.md" --exclude-pattern "node_modules,.next,dist,build"
```

### Option 3: Subdirectory scan

```bash
# Chỉ scan phần cần
gitingest ./src/app > docs/app-summary.md
gitingest ./src/lib > docs/lib-summary.md
```

## URL Mode cho Remote Repos

Hữu ích khi cần xem nhanh repo chưa clone:

```bash
# Quick overview
gitingest https://github.com/vercel/next.js/tree/canary/packages/next

# Lưu để tham chiếu
gitingest https://github.com/user/repo > docs/external-summary.md
```

**Lưu ý:**
- URL mode cần internet connection
- Large repos có thể chậm
- Một số repos private cần auth (chưa hỗ trợ trực tiếp)

## Integration với ForgeKit Workflow

1. **Fallback position**: Dùng gitingest khi code2prompt không available
   ```bash
   if ! command -v code2prompt &>/dev/null; then
     gitingest . > docs/codebase-summary.md
   fi
   ```

2. **Remote analysis**: Khi cần hiểu external dependency/source
   ```bash
   gitingest https://github.com/some-org/some-lib > docs/dep-overview.md
   ```

3. **Quick check**: Khi cần fast scan mà không cần template control
   ```bash
   gitingest . --include-pattern "*.py" | head -c 8000
   ```

## So sánh code2prompt vs gitingest

| Feature | code2prompt | gitingest |
|---|---|---|
| Token budget control | `--tokens` flag | Manual (head/truncate) |
| Custom template | Jinja2 templates | Không |
| Remote repo | Không | Có (URL mode) |
| Exclude patterns | `--exclude-file` | `--exclude-pattern` |
| Output format | Configurable | Fixed structure |
| Install size | Nhỏ | Nhỏ |
| Speed | Nhanh | Nhanh |

**Khuyến nghị:** Ưu tiên `code2prompt` cho local work (template control + token budget). Dùng `gitingest` khi cần remote repo analysis hoặc khi code2prompt chưa cài.

## Troubleshooting

| Issue | Fix |
|---|---|
| `command not found` | `pip install gitingest` hoặc check PATH |
| Output quá lớn | Dùng `--exclude-pattern` hoặc pipe qua `head -c` |
| Remote repo timeout | Thử subdirectory URL thay vì toàn bộ repo |
| Binary files trong output | `--max-file-size 10240` để skip files lớn |
