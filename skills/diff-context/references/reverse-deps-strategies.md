# Reverse Dependency Strategies

4 strategies tìm reverse dependencies, từ chính xác nhất đến fallback universal.

## Vấn đề

Khi file `A.ts` thay đổi, cần biết:
- **Ai import file A?** (file-level deps)
- **Ai dùng symbol X từ file A?** (symbol-level deps)

File-level nhanh nhưng coarse. Symbol-level chính xác nhưng cần tooling.

---

## Strategy 1: GitNexus MCP `impact`

### Khi nào dùng
- GitNexus MCP available (check `mcp_gitnexus__impact` tồn tại)
- Codebase có LSP index
- Cần symbol-level precision

### Cách dùng

```
# Tìm tất cả references đến một symbol
mcp_gitnexus__impact(symbol_path)

# Ví dụ: tìm ai dùng loginHandler từ auth.ts
mcp_gitnexus__impact("src/api/auth.ts:loginHandler")
```

### Workflow

1. Extract exported symbols từ changed files:
   ```
   mcp_gitnexus__query(file_path)
   ```
2. Cho mỗi exported symbol, tìm references:
   ```
   mcp_gitnexus__impact(symbol_path)
   ```
3. Collect unique file paths từ references

### Ưu điểm
- **Precise**: Tìm đúng symbol references, không phải file-level
- **Cross-language**: Works với TS, Python, Go, Rust (nếu LSP hỗ trợ)
- **Type-aware**: Hiểu type aliases, re-exports

### Nhược điểm
- Cần GitNexus MCP setup
- LSP indexing có thể chậm lần đầu
- Một số edge cases (dynamic imports, reflection) không detect được

### Fallback signal
Nếu `mcp_gitnexus__impact` timeout hoặc error → chuyển Strategy 3.

---

## Strategy 2: ast-grep AST Reference Search

### Khi nào dùng
- ast-grep (`sg`) installed
- Cần precise search mà GitNexus không available
- Codebase chủ yếu là JS/TS/Python/Rust

### Cách dùng

```bash
# Install check
sg --version

# Tìm tất cả import declarations trỏ đến changed module
sg -p 'import { $IMPORTS } from "$MODULE"' --lang typescript -r '$IMPORTS' .

# Tìm tất cả require calls
sg -p 'require("$MODULE")' --lang javascript .

# Tìm function call references
sg -p '$FN($$$ARGS)' --lang typescript -r '$FN' . \
  | grep "changedFunctionName"
```

### Workflow

1. Cho mỗi changed file, tạo ast-grep pattern cho import:
   ```bash
   # Module path từ file path
   MODULE="src/api/auth"  # từ src/api/auth.ts
   
   # Tìm imports
   sg -p "import { $$$ } from \"${MODULE}\"" --lang typescript -l .
   sg -p "import { $$$ } from '${MODULE}'" --lang typescript -l .
   ```

2. Cho mỗi exported symbol, tìm usages:
   ```bash
   sg -p "loginHandler($$$)" --lang typescript -l .
   sg -p "loginHandler" --lang typescript -l .
   ```

### Ưu điểm
- **AST-accurate**: Không bị confuse bởi comments, strings
- **Fast**: ast-grep dùng Rust, rất nhanh
- **Language-aware**: Pattern match theo AST structure

### Nhược điểm
- Cần ast-grep installed
- Cần viết pattern cho từng case
- Không type-aware (không phân biệt same name khác scope)

### Pattern Library

```yaml
# Common patterns cho JS/TS
import_default: 'import $NAME from "$MODULE"'
import_named: 'import { $$$NAMES } from "$MODULE"'
import_side: 'import "$MODULE"'
require: 'require("$MODULE")'
dynamic_import: 'import("$MODULE")'

# Common patterns cho Python
import_module: 'import $MODULE'
from_import: 'from $MODULE import $$$NAMES'

# Common patterns cho Go
go_import: 'import "$MODULE"'
```

---

## Strategy 3: ripgrep Regex Import Tracing

### Khi nào dùng
- **Universal fallback** — luôn available
- GitNexus và ast-grep không có
- Cần nhanh, chấp nhận chút noise

### Cách dùng

#### File-level: Tìm ai import changed module

```bash
# Extract module path từ file path
# src/api/auth.ts → "api/auth" hoặc "@/api/auth" hoặc "../api/auth"

# Tìm relative imports
rg "from ['\"].*api/auth['\"]" --type-add 'src:*.{ts,tsx,js,jsx}' -t src -l
rg "require\(['\"].*api/auth['\"]\)" --type-add 'src:*.{ts,tsx,js,jsx}' -t src -l

# Tìm alias imports (Next.js @/, ~/)
rg "from ['\"]@/api/auth['\"]" -t ts -l
rg "from ['\"]~/api/auth['\"]" -t ts -l
```

#### Symbol-level: Tìm ai dùng changed symbol

```bash
# Tìm usage của function/class name
rg "loginHandler" --type-add 'src:*.{ts,tsx,js,jsx}' -t src -l
rg "validateEmail" -t ts -l

# Kết hợp: file references + symbol references
rg "loginHandler|validateEmail" -t src -l
```

#### Python-specific

```bash
# from api.auth import ...
rg "from\s+api\.auth\s+import" --type py -l
rg "import\s+api\.auth" --type py -l

# Symbol usage
rg "login_handler" --type py -l
```

#### Go-specific

```bash
# Import path
rg "\"github.com/org/repo/api/auth\"" --type go -l

# Symbol usage (Go: capitalized = exported)
rg "LoginHandler" --type go -l
```

### Workflow

1. Parse changed file paths → module paths
2. Cho mỗi module path, rg import patterns
3. Extract exported symbols → rg symbol patterns
4. Combine results, deduplicate

```bash
#!/bin/bash
# Quick reverse deps via ripgrep
CHANGED_FILE="$1"
MODULE=$(echo "$CHANGED_FILE" | sed 's|src/||; s|\.[^.]*$||')

echo "=== Module: $MODULE ==="
echo "--- Import references ---"
rg "from ['\"].*${MODULE}['\"]" -t src -l 2>/dev/null
rg "require\(['\"].*${MODULE}['\"]\)" -t src -l 2>/dev/null

echo "--- Symbol references ---"
# Extract exports from changed file
EXPORTS=$(rg "export\s+(function|const|class|interface|type)\s+(\w+)" "$CHANGED_FILE" -o -r '$2' 2>/dev/null)

for sym in $EXPORTS; do
  echo "  Symbol: $sym"
  rg "\b${sym}\b" -t src -l 2>/dev/null | grep -v "$CHANGED_FILE"
done
```

### Ưu điểm
- **Always available**: ripgrep everywhere
- **Fast**: ripgrep cực nhanh
- **Universal**: Works với mọi ngôn ngữ

### Nhược điểm
- **Noise**: Regex matching không AST-aware
  - String matches: `"loginHandler"` trong string/comment
  - Same name khác scope
  - False positives từ similar names
- **No type awareness**: Không biết import alias
- **Relative path hell**: `../auth`, `./auth`, `@/auth` — cần try nhiều patterns

### Noise Reduction

Giảm false positives:

```bash
# Chỉ match word boundaries
rg "\bloginHandler\b" -t src -l

# Loại trừ comments (rough)
rg "\bloginHandler\b" -t src -l | while read f; do
  rg "\bloginHandler\b" "$f" | rg -v '^\s*(//|/\*|\*|#)'
done

# Loại trừ test files nếu chỉ cần production deps
rg "\bloginHandler\b" -t src -l | rg -v '\.(test|spec)\.'
```

---

## Strategy 4: tree-sitter Local Symbol Index

### Khi nào dùng
- Có tree-sitter CLI hoặc tree-sitter bindings
- Cần offline symbol index (không LSP server)
- Codebase có nhiều languages

### Cách dùng

#### Build Symbol Index

```bash
# Parse file thành AST
tree-sitter parse path/to/changed-file.ts

# Query cho imports
tree-sitter query '(import_statement (import_clause (named_imports (import_specifier name: (identifier) @import-name))) source: (string (string_fragment) @source))' path/to/file.ts
```

#### Find References

```python
import tree_sitter

def find_references(symbol_name, file_path, language):
    """Find all references to symbol in file using tree-sitter."""
    parser = tree_sitter.Parser()
    parser.language = language
    
    with open(file_path, 'rb') as f:
        tree = parser.parse(f.read())
    
    # Query for identifier nodes matching symbol
    query = language.query(f'((identifier) @ref (#eq? @ref "{symbol_name}"))')
    matches = query.matches(tree.root_node)
    
    return [(file_path, m[0].start_point.row) for m in matches]
```

### Ưu điểm
- **Offline**: Không cần LSP server
- **Precise**: AST-based, không regex
- **Incremental**: Re-parse chỉ changed files

### Nhược điểm
- Cần tree-sitter grammars cho mỗi language
- Setup phức tạp hơn ripgrep
- Không cross-reference (chỉ tìm trong 1 file)

### Best Used For
- Pre-building symbol index cho large codebase
- CI/CD pipeline context generation
- Complementing Strategy 3 (ripgrep) với AST precision

---

## Strategy Selection Decision Tree

```
Có GitNexus MCP?
├── Yes → Strategy 1 (GitNexus)
│   └── Timeout/Error?
│       └── Có ast-grep?
│           ├── Yes → Strategy 2 (ast-grep)
│           └── No → Strategy 3 (ripgrep)
└── No → Có ast-grep?
    ├── Yes → Strategy 2 (ast-grep)
    └── No → Strategy 3 (ripgrep)
        └── Cần offline index?
            └── Yes → Strategy 4 (tree-sitter)
```

**Default path**: Strategy 3 (ripgrep) — always works, good enough for most cases.

---

## Scope Limits (áp dụng cho mọi strategy)

| Metric | Limit | Lý do |
|--------|-------|-------|
| Max reverse dep files | 20 | Tránh token explosion |
| Max symbols to trace per file | 10 | Time/complexity |
| Max total references | 50 | Relevance cutoff |
| Priority 1 | Direct imports | Closest dependency |
| Priority 2 | Symbol usages | Behavioral dependency |
| Priority 3 | Test files | Verification context |

Khi vượt limit: giữ Priority 1 + 2, truncate Priority 3.
