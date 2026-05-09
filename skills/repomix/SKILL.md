---
name: ck:repomix
description: >
  Tạo codebase summary để dùng với watzup hoặc context-engineering.
  Chỉ chạy khi user yêu cầu rõ hoặc khi watzup không tìm thấy summary.
  Hỗ trợ preset theo loại project, chunked output, và .forgeignore.
---

# Repomix

Trigger: "tóm tắt codebase", "repomix", "codebase summary", "map project"

## Làm gì
1. Chạy repomix với preset phù hợp (xem Presets bên dưới)
2. Nếu repomix chưa cài: `npm i -g repomix` trước
3. Không tự động chạy — chỉ khi được gọi rõ ràng
4. Ưu tiên dùng `.forgeignore` nếu có trong project root

## Token rule
**Không inject toàn bộ output vào context.** Chỉ đọc section cần thiết.
- Full output có thể >100k tokens — luôn đọc theo chunk
- Dùng `Read` với offset/limit để đọc từng phần
- Chunked output strategy: tách theo module/directory

## Presets

### TypeScript / React project
```bash
npx repomix --include "src/**/*.{ts,tsx}" --ignore "**/*.test.*,**/dist/**,**/node_modules/**" --output docs/codebase-summary.md
```

### Python project
```bash
npx repomix --include "**/*.py" --ignore "**/*.test.py,**/venv/**,**/__pycache__/**" --output docs/codebase-summary.md
```

### Using .forgeignore
```bash
npx repomix --ignore-file .forgeignore --output docs/codebase-summary.md
```

### Go project
```bash
npx repomix --include "**/*.go" --ignore "**/*_test.go,**/vendor/**" --output docs/codebase-summary.md
```

### Rust project
```bash
npx repomix --include "src/**/*.rs" --ignore "**/target/**" --output docs/codebase-summary.md
```

## --include and --ignore patterns

`--include` — chỉ lấy file match pattern (glob). Dùng khi project lớn, chỉ cần subset.
`--ignore` — loại file match pattern. Ưu tiên cao hơn include.
`--ignore-file` — đọc ignore patterns từ file (ví dụ `.forgeignore`).

**Luôn ignore:**
- `node_modules/`, `dist/`, `build/`, `.next/`, `coverage/`
- Test files: `*.test.*`, `*.spec.*`, `__tests__/`
- Generated: `*.generated.*`, `*.min.*`, `*.bundle.js`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`

## Chunked Output Strategy

Khi output quá lớn (>5k tokens), repomix nên chia theo module:

1. **Per-module output** — chạy riêng từng directory chính:
   ```bash
   npx repomix --include "src/auth/**" --output docs/codebase-auth.md
   npx repomix --include "src/api/**" --output docs/codebase-api.md
   npx repomix --include "src/ui/**" --output docs/codebase-ui.md
   ```

2. **Read by section** — không đọc toàn bộ file, dùng offset/limit:
   ```
   Read docs/codebase-summary.md  offset=1   limit=200  # headers + module A
   Read docs/codebase-summary.md  offset=201 limit=200  # module B
   ```

3. **Index-first** — đọc phần đầu (file list), sau đó chỉ đọc module cần thiết.

## Token Budget Rules

| Repo size | Max output tokens | Strategy |
|-----------|-------------------|----------|
| <50 files | ≤3k | Single output ok |
| 50-200 files | ≤8k | Chunked per directory |
| 200-500 files | ≤15k | Per-module output files |
| >500 files | ≤20k | Per-module + index-only read |

**Never inject full repomix output into context.** Always read sections only.
