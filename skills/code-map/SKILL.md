---
name: ck:code-map
description: >
  Generate token-bounded codebase summary using code2prompt or gitingest as fallback
  when Serena MCP is unavailable. Use for quick codebase overview without full file reads.
metadata:
  author: forgekit
  version: "1.0.0"
---

# Code Map

Token-bounded codebase summarization — fallback khi Serena MCP không available.

## Trigger

- "map codebase", "code map", "tóm tắt repo", "codebase overview"
- "code2prompt", "gitingest"
- Cần hiểu nhanh project structure mà không muốn đọc từng file
- Serena MCP không available hoặc chưa cài
- Orchestrator cần context overview trước khi route task

## Khi nào KHÔNG dùng

- Serena MCP available → dùng `get_symbols_overview` + `find_symbol` (chính xác hơn)
- Chỉ cần đọc 1-2 file cụ thể → dùng native read
- Đã có `docs/codebase-summary.md` mới (từ repomix) → đọc file đó thay vì generate lại

## Quy trình

### 1. Kiểm tra tool available

```
which code2prompt || which gitingest
```

- Cả hai đều có → ưu tiên `code2prompt` (template control tốt hơn)
- Chỉ `gitingest` → dùng gitingest
- Không có gì → cài `code2prompt`: `pip install code2prompt`

### 2. Chạy code2prompt (ưu tiên)

```bash
code2prompt . \
  --output docs/codebase-summary.md \
  --tokens <TOKEN_BUDGET> \
  --template code-map \
  --exclude-file ".forgeignore,.git,node_modules,__pycache__,.venv,dist,build,.next,coverage"
```

Xem `references/code2prompt-guide.md` cho template tùy chỉnh và options đầy đủ.

### 3. Fallback: chạy gitingest

```bash
gitingest . --output docs/codebase-summary.md
```

Xem `references/gitingest-guide.md` cho URL mode và token limiting.

### 4. Post-processing

1. Đọc output file đã generate
2. Kiểm tra token count — nếu vượt budget, truncate hoặc re-run với `--tokens` nhỏ hơn
3. Inject vào context chỉ phần cần thiết (không inject toàn bộ)

## Token Budget Rules

| Context | Budget | Action |
|---|---|---|
| Quick overview | ≤ 2000 tokens | `--tokens 2000` |
| Standard task | ≤ 4000 tokens | `--tokens 4000` |
| Deep analysis | ≤ 8000 tokens | `--tokens 8000` |

**Luôn bắt đầu với budget nhỏ nhất đủ dùng.** Escalate chỉ khi task yêu cầu.

## Integration với .forgeignore

Nếu project có `.forgeignore`, code2prompt tự động tôn trọng khi chạy từ project root.
Nếu không có, dùng `--exclude-file` với pattern mặc định:

```
.git
node_modules
__pycache__
.venv
dist
build
.next
coverage
*.lock
*.min.js
*.min.css
```

## Tool Selection Decision Tree

```
Serena MCP available?
├─ YES → use Serena (get_symbols_overview, find_symbol)
└─ NO → code2prompt available?
         ├─ YES → code2prompt with template
         └─ NO → gitingest available?
                  ├─ YES → gitingest (structured output)
                  └─ NO → pip install code2prompt → retry
```

## Output Format

Summary phải chứa:

1. **Project overview** — name, purpose, tech stack
2. **Directory tree** — simplified, max 3 levels
3. **Key files** — entry points, configs, main modules
4. **Dependencies** — từ package.json / requirements.txt
5. **Token count** — tổng tokens trong summary

## References

- `references/code2prompt-guide.md` — code2prompt cài đặt, template, options
- `references/gitingest-guide.md` — gitingest cài đặt, URL mode, token limiting
