# Diff Workflow

Chi tiết từng bước workflow cho diff-context skill. Bao gồm fallback khi tools không available.

## Inspired By

### Continue.dev `@diff` Context Provider

Continue.dev cung cấp `@diff` context provider load git diff vào context window.
Key insight: cho fix/refactor tasks, diff chứa tất cả thông tin cần — không cần scan toàn codebase.

**Pattern:**
1. Lấy git diff (staged + unstaged)
2. Parse ra changed hunks
3. Load hunks vào context
4. Agent chỉ thấy phần thay đổi + surrounding context

### OpenHands `git_changes` Microagent

OpenHands dùng `git_changes` microagent để hiểu scope của changes.
Key insight: thêm reverse dependencies để agent hiểu impact của changes.

**Pattern:**
1. Lấy diff + changed file list
2. Tìm files reference changed symbols
3. Load cả changed files và reverse deps
4. Agent hiểu đủ context để fix/refactor chính xác

---

## Step 1: Get Git Diff

### Default: Staged + Unstaged

```bash
# Tất cả changes so với HEAD
git diff HEAD

# Chỉ file names (nhanh hơn cho bước đầu)
git diff --name-only HEAD

# Stats cho overview
git diff --stat HEAD
```

### Với Base Reference

Nếu user cung cấp `--base=REF`:

```bash
git diff <REF>...HEAD
git diff --name-only <REF>...HEAD
git diff --stat <REF>...HEAD
```

Triple-dot (`...`) so sánh với merge-base — chỉ thấy changes trên current branch.

### Chỉ Staged Changes

```bash
git diff --cached
git diff --cached --name-only
```

### Chỉ Unstaged Changes

```bash
git diff
git diff --name-only
```

### Fallback: Last Commit

Nếu working tree clean, dùng last commit:

```bash
git log -1 --stat
git diff HEAD~1...HEAD
```

### Fallback: No Git

Nếu không phải git repo:
- Route sang `ck:context-engineering`
- Skill này không applicable

### Lưu ý

- Bỏ qua merge commits (đã có changes từ cả 2 sides)
- `git diff --name-only` đủ cho Step 2, không cần full diff content
- Full diff chỉ cần khi build context window (Step 5)

---

## Step 2: Extract Changed File Paths

### Parse Output

```bash
git diff --name-only HEAD
```

Kết quả là list file paths, mỗi dòng 1 file.

### Filtering

Bỏ qua files không cần context:

```bash
# Loại trừ bằng pattern
git diff --name-only HEAD | grep -v -E '(
  package-lock\.json|
  yarn\.lock|
  pnpm-lock\.yaml|
  \.min\.js$|
  \.min\.css$|
  \.generated\.|
  /dist/|
  /vendor/|
  /node_modules/
)'
```

Hoặc trong code:

```python
SKIP_PATTERNS = [
    r'lock\.json$', r'lock\.yaml$',
    r'\.min\.', r'\.generated\.',
    r'/dist/', r'/vendor/', r'/node_modules/',
    r'\.svg$', r'\.png$', r'\.jpg$',
]

def should_include(filepath):
    return not any(re.search(p, filepath) for p in SKIP_PATTERNS)
```

### Categorize

Phân loại changed files:

| Category | Pattern | Action |
|----------|---------|--------|
| Source code | `*.{ts,tsx,js,jsx,py,rs,go}` | Load full |
| Config | `*.{json,yaml,yml,toml}` | Load full |
| Styles | `*.{css,scss,less}` | Load full if < 100 lines, else hunk |
| Tests | `*.test.*, *.spec.*` | Load full (quan trọng cho verification) |
| Docs | `*.md` | Skip unless task type là docs |
| Generated | `*.min.*, *.generated.*` | Skip |

---

## Step 3: Find Reverse Dependencies

Chi tiết strategies tại `reverse-deps-strategies.md`.

### Quick Reference

Cho mỗi changed file, cần trả lời: **"Ai dùng file/symbol này?"**

**Với GitNexus MCP (preferred):**
```
mcp_gitnexus__impact(symbol_path)
```

**Với ripgrep (fallback):**
```bash
# Tìm import/require của changed module
rg "from ['\"].*changed-module['\"]" --type-add 'src:*.{ts,tsx,js,jsx}' -t src
rg "require\(['\"].*changed-module['\"]\)" -t src
rg "import.*changed-module" -t src
```

### Scope Limit

- Tối đa **20 reverse dep files** (tránh token explosion)
- Ưu tiên: direct imports > indirect references > test files
- Nếu > 20: chỉ giữ direct imports + test files

---

## Step 4: Load Only Changed Files + Reverse Deps

### Loading Strategy

**Changed files:** Load toàn bộ nội dung.

```bash
# Đọc file content
cat path/to/changed-file.ts
```

**Reverse dep files:** Chỉ load phần liên quan.

Với GitNexus:
- `get_file_symbol_info` → lấy symbol positions
- Đọc range quanh symbol reference

Với ripgrep:
- `rg -n "changed-symbol" path/to/dep-file.ts` → lấy line numbers
- Đọc ±20 lines quanh mỗi reference

### Token-Aware Loading

```python
MAX_TOTAL_TOKENS = 5000
APPROX_CHARS_PER_TOKEN = 4  # rough estimate

def load_with_budget(files, budget=MAX_TOTAL_TOKENS * APPROX_CHARS_PER_TOKEN):
    loaded = {}
    remaining = budget
    
    # Changed files first (priority)
    for f in changed_files:
        content = read_file(f)
        if len(content) <= remaining:
            loaded[f] = content
            remaining -= len(content)
        else:
            loaded[f] = content[:remaining] + "\n... [truncated]"
            remaining = 0
            break
    
    # Then reverse deps
    for f in dep_files:
        if remaining <= 0:
            break
        hunks = extract_relevant_hunks(f, changed_symbols)
        hunk_content = "\n".join(hunks)
        if len(hunk_content) <= remaining:
            loaded[f] = hunk_content
            remaining -= len(hunk_content)
    
    return loaded
```

### Scope Flags

| Flag | Load | Skip |
|------|------|------|
| `--scope=files` | Changed files only | Reverse deps |
| `--scope=deps` | Reverse deps only | Changed files |
| `--scope=all` | Both | Nothing |

---

## Step 5: Build Minimal Context Window

### Template

```markdown
## Diff Summary
[git diff --stat HEAD output]

## Changed Files

### path/to/changed-file-1.ts
\`\`\`typescript
[full content or relevant hunks]
\`\`\`

### path/to/changed-file-2.ts
\`\`\`typescript
[full content or relevant hunks]
\`\`\`

## Reverse Dependencies

### path/to/dep-file-1.ts (→ references: changed-file-1.ts:exportedFunc)
\`\`\`typescript
[relevant hunk with ±context lines]
\`\`\`

### path/to/dep-file-2.ts (→ references: changed-file-1.ts:ClassName)
\`\`\`typescript
[relevant hunk with ±context lines]
\`\`\`
```

### Context Window Rules

1. **Diff summary luôn ở đầu** — cho overview nhanh
2. **Changed files trước** — primary context
3. **Reverse deps sau** — supplementary context
4. **Mỗi reverse dep ghi rõ reference** — agent biết tại sao file này liên quan
5. **Truncate files quá lớn** — ghi `[truncated at line N]`

### Final Check

Trước khi trả context cho agent:
- [ ] Diff summary có đúng?
- [ ] Tất cả changed files đã load?
- [ ] Reverse deps có ghi rõ reference?
- [ ] Total tokens ≤ budget?
- [ ] Không có file thừa (không liên quan)?

---

## Complete Example

### Input

Task: "Fix the login API returning 500 when email is empty"

### Step 1: Get Diff

```bash
$ git diff --stat HEAD
 src/api/auth.ts       | 12 ++++++------
 src/api/validators.ts |  3 ++-
 src/tests/auth.test.ts|  8 ++++++++
 3 files changed, 12 insertions(+), 6 deletions(-)
```

### Step 2: Extract Files

Changed files:
- `src/api/auth.ts`
- `src/api/validators.ts`
- `src/tests/auth.test.ts`

### Step 3: Reverse Deps

`src/api/auth.ts` exports `loginHandler` → referenced by:
- `src/routes/index.ts` (import { loginHandler })
- `src/middleware/auth.ts` (import { loginHandler })

`src/api/validators.ts` exports `validateEmail` → referenced by:
- `src/api/auth.ts` (already in changed files)
- `src/api/register.ts` (import { validateEmail })

Reverse deps to load:
- `src/routes/index.ts`
- `src/middleware/auth.ts`
- `src/api/register.ts`

### Step 4: Load

Load full:
- `src/api/auth.ts` (changed)
- `src/api/validators.ts` (changed)
- `src/tests/auth.test.ts` (changed, test)

Load hunk:
- `src/routes/index.ts` (hunk around `loginHandler` import)
- `src/middleware/auth.ts` (hunk around `loginHandler` import)
- `src/api/register.ts` (hunk around `validateEmail` import)

### Step 5: Build Context

Context window assembled với template ở trên.
Total: ~3 files full + 3 hunks ≈ 2500 tokens.

**vs. full codebase scan: ~50K+ tokens. Savings: 95%.**
