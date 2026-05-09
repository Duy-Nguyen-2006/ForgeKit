# code2prompt Guide

code2prompt (mufeedvh/code2prompt) — CLI tool chuyển codebase thành prompt-ready markdown với token control.

## Installation

```bash
# pip (global)
pip install code2prompt

# pipx (isolated, recommended)
pipx install code2prompt

# Verify
code2prompt --version
```

## Basic Usage

```bash
# Generate summary of current directory
code2prompt .

# Specify output file
code2prompt . --output docs/codebase-summary.md

# Limit tokens
code2prompt . --tokens 4000 --output docs/codebase-summary.md

# Use custom template
code2prompt . --template code-map --output docs/codebase-summary.md
```

## Key Options

| Option | Description | Default |
|---|---|---|
| `--output` | Output file path | stdout |
| `--tokens` | Max tokens in output | unlimited |
| `--template` | Jinja2 template name or path | default |
| `--exclude-file` | Comma-separated exclude patterns | `.git` |
| `--include-file` | Comma-separated include patterns | all |
| `--encoding` | Tokenizer encoding | `cl100k_base` |
| `--lower-bound` | Min tokens (stop early if reached) | 0 |
| `--no-codeblock` | Disable markdown code blocks | false |
| `--line-number` | Add line numbers to code | false |
| `--relative-path` | Use relative paths in output | true |

## Custom Template for ForgeKit

Tạo file `~/.config/code2prompt/templates/code-map.jinja2`:

```jinja2
# Codebase Summary

## Project Overview
- **Path:** {{ repository_path }}
- **Token Count:** {{ token_count }}

## Directory Structure
```
{{ tree }}
```

## Key Files

{% for file in files %}
### {{ file.path }} ({{ file.token_count }} tokens)
{% if file.token_count <= 200 %}
```{{ file.language }}
{{ file.content }}
```
{% else %}
[Summary: {{ file.token_count }} tokens — read selectively]
{% endif %}

{% endfor %}

## Statistics
- Total files: {{ files|length }}
- Total tokens: {{ token_count }}
```

Sau đó chạy:

```bash
code2prompt . --template ~/.config/code2prompt/templates/code-map.jinja2 --output docs/codebase-summary.md
```

## Exclude Patterns

### Via .forgeignore (recommended)

code2prompt tôn trọng `.forgeignore` khi chạy từ project root.

### Via CLI flag

```bash
code2prompt . \
  --exclude-file ".forgeignore,.git,node_modules,__pycache__,.venv,dist,build,.next,coverage,*.lock,*.min.js,*.min.css,package-lock.json,bun.lock"
```

### Common exclude patterns

```
# Version control
.git
.hg

# Dependencies
node_modules
.venv
venv
__pypackages__

# Build output
dist
build
.next
out
.nuxt

# Cache
__pycache__
.cache
.turbo

# Lock files
*.lock
package-lock.json
bun.lock
pnpm-lock.yaml

# Minified files
*.min.js
*.min.css
*.map

# IDE
.idea
.vscode

# Coverage
coverage
.nyc_output
```

## Token Counting

code2prompt dùng `tiktoken` với `cl100k_base` encoding (GPT-4 compatible).

Kiểm tra token count mà không generate file:

```bash
code2prompt . --tokens 0 2>&1 | head -5
```

## Integration với ForgeKit Workflow

1. **Before task**: Generate summary với budget phù hợp
   ```bash
   code2prompt . --tokens 4000 --output docs/codebase-summary.md
   ```

2. **Read selectively**: Đọc chỉ phần cần thiết từ output
   - Directory structure → orient phase
   - Specific file content → implement phase

3. **Cache**: Nếu summary còn mới (< 1 session), reuse thay vì generate lại

4. **Update**: Sau khi modify codebase significantly, regenerate

## Troubleshooting

| Issue | Fix |
|---|---|
| `command not found` | `pip install code2prompt` hoặc check PATH |
| Output quá lớn | Giảm `--tokens`, thêm `--exclude-file` |
| Binary files trong output | Thêm `*.png,*.jpg,*.ico,*.woff,*.ttf` vào exclude |
| Token count sai | Update tiktoken: `pip install -U tiktoken` |
