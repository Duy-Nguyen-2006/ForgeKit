# Tree-Sitter Symbol Index Reference

Cách xây dựng local symbol index bằng tree-sitter-cli hoặc ts-morph, cached tại `.forge/cache/symbols.json` với mtime-based invalidation. Giảm ≥60% repeated token reads.

## Why Local Symbol Index Matters

Khi agent cần hiểu codebase, nó thường đọc toàn bộ file → tốn nhiều tokens. Symbol index cho phép:

1. **Lookup nhanh** — tìm symbol location mà không cần đọc file
2. **Offline** — không cần GitNexus MCP server hay LSP
3. **Faster** — index local, read JSON cache thay vì parse lại
4. **Cheaper** — giảm token usage ≥60% cho orient phase

**So sánh:**

| Method | Tokens để tìm 1 symbol | Prerequisites |
|---|---|---|
| Đọc toàn bộ file | 5,000-50,000 | None |
| GitNexus context | 100-500 | MCP server |
| Local symbol index | 50-200 | Cache file |

**Khi nào dùng local index vs GitNexus:**
- Small projects (< 500 files): local index nhanh hơn, không cần MCP
- Offline / no MCP: local index là duy nhất option
- Large monorepo (> 500 files): GitNexus có thể tốt hơn (server-side indexing)
- Best: dùng cả hai — local index cho fallback, GitNexus cho precision

## Option 1: tree-sitter-cli

### Install

```bash
npm install -g tree-sitter-cli

# Init config (downloads grammars)
tree-sitter init-config

# Hoặc install grammar cụ thể
tree-sitter install-python
tree-sitter install-typescript
tree-sitter install-rust
tree-sitter install-go
tree-sitter install-java
```

### Parse

```bash
# Parse single file → CST (concrete syntax tree)
tree-sitter parse src/auth/service.ts

# Output example:
# (program [0, 0] - [150, 0]
#   (import_statement [0, 0] - [0, 30]
#     (import_clause [0, 7] - [0, 20]
#       (named_imports [0, 9] - [0, 19]
#         (import_specifier [0, 10] - [0, 18]
#           name: (identifier [0, 10] - [0, 18]))))
#     source: (string [0, 24] - [0, 30]))
#   (class_declaration [2, 0] - [150, 1]
#     name: (type_identifier [2, 6] - [2, 17])
#     body: (class_body [2, 18] - [150, 1]
#       (method_definition [5, 2] - [20, 3]
#         name: (property_identifier [5, 2] - [5, 7])
#         parameters: (formal_parameters [5, 7] - [5, 28])
#         body: (statement_block [5, 29] - [20, 3])))))
```

### Extract Symbols via Query

Tree-sitter queries dùng S-expression pattern matching:

**TypeScript/JavaScript query** (`queries/typescript.scm`):

```scm
; Class declarations
(class_declaration
  name: (type_identifier) @name) @symbol

; Function declarations
(function_declaration
  name: (identifier) @name) @symbol

; Interface declarations
(interface_declaration
  name: (type_identifier) @name) @symbol

; Type aliases
(type_alias_declaration
  name: (type_identifier) @name) @symbol

; Method definitions
(method_definition
  name: (property_identifier) @name) @symbol

; Variable declarations (module-level)
(variable_declarator
  name: (identifier) @name) @symbol

; Enum declarations
(enum_declaration
  name: (identifier) @name) @symbol

; Export statements
(export_statement) @export
```

**Python query** (`queries/python.scm`):

```scm
; Function definitions
(function_definition
  name: (identifier) @name) @symbol

; Class definitions
(class_definition
  name: (identifier) @name) @symbol

; Decorators
(decorator) @decorator
```

**Rust query** (`queries/rust.scm`):

```scm
; Function definitions
(function_item
  name: (identifier) @name) @symbol

; Struct definitions
(struct_item
  name: (type_identifier) @name) @symbol

; Enum definitions
(enum_item
  name: (type_identifier) @name) @symbol

; Impl blocks
(impl_item
  type: (type_identifier) @name) @symbol

; Trait definitions
(trait_item
  name: (type_identifier) @name) @symbol
```

### Run query

```bash
# Extract symbols from single file
tree-sitter query queries/typescript.scm src/auth/service.ts

# Batch extract from all TS files
find src -name '*.ts' -not -path '*/node_modules/*' -exec \
  tree-sitter query queries/typescript.scm {} \;

# Parse to JSON for programmatic use
tree-sitter parse --json src/auth/service.ts | jq '...'
```

### Output format

Tree-sitter query returns captures. Parse thành symbol list:

```
symbol: class_declaration  name: AuthService    line: 2
symbol: method_definition  name: login          line: 5
symbol: method_definition  name: validateSession line: 22
symbol: interface_declaration name: Credentials  line: 45
```

## Option 2: ts-morph (TypeScript/JavaScript only)

### Install

```bash
npm install ts-morph
# Hoặc dùng npx (không cần install global)
npx ts-morph
```

### Script to extract all symbols

```typescript
// scripts/extract-symbols.ts
import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";

const project = new Project({
  tsConfigFilePath: "./tsconfig.json",
  // Hoặc manual:
  // skipAddingFilesFromTsConfig: true,
});

// Add files manually nếu không có tsconfig
// project.addSourceFilesAtPaths("src/**/*.ts");

interface SymbolInfo {
  name: string;
  kind: string;
  line: number;
  file: string;
}

const results: {
  file: string;
  symbols: SymbolInfo[];
  mtime: number;
}[] = [];

const kindMap: Record<number, string> = {
  [SyntaxKind.ClassDeclaration]: "class",
  [SyntaxKind.FunctionDeclaration]: "function",
  [SyntaxKind.InterfaceDeclaration]: "interface",
  [SyntaxKind.TypeAliasDeclaration]: "type",
  [SyntaxKind.EnumDeclaration]: "enum",
  [SyntaxKind.MethodDeclaration]: "method",
  [SyntaxKind.PropertyDeclaration]: "property",
  [SyntaxKind.VariableDeclaration]: "variable",
  [SyntaxKind.ModuleDeclaration]: "module",
};

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  const mtime = fs.statSync(filePath).mtimeMs;

  const symbols: SymbolInfo[] = [];

  // Traverse all descendants
  sourceFile.forEachDescendant((node) => {
    const kind = node.getKind();
    if (kindMap[kind]) {
      const nameNode = node as any;
      const name = nameNode.getName?.() || nameNode.getSymbol?.()?.getName() || "";
      if (name) {
        symbols.push({
          name,
          kind: kindMap[kind],
          line: node.getStartLineNumber(),
          file: filePath,
        });
      }
    }
  });

  results.push({ file: filePath, symbols, mtime });
}

// Output
console.log(JSON.stringify(results, null, 2));
```

### Run

```bash
npx ts-node scripts/extract-symbols.ts > .forge/cache/symbols.json
```

**Pros over tree-sitter:**
- Hiểu TypeScript type system đầy đủ (generics, decorators, etc.)
- Có reference counting built-in (findReferences)
- Có type info (return types, parameter types)

**Cons:**
- Chỉ works với TypeScript/JavaScript
- Chậm hơn tree-sitter cho large projects
- Requires tsconfig.json

### Advanced: Reference counting with ts-morph

```typescript
// Count references for ranking
for (const sourceFile of project.getSourceFiles()) {
  sourceFile.forEachDescendant((node) => {
    if (node.getKind() === SyntaxKind.ClassDeclaration) {
      const refs = (node as any).findReferences?.() || [];
      const refCount = refs.reduce(
        (sum: number, r: any) => sum + r.getReferences().length,
        0
      );
      console.log(`class ${(node as any).getName()}: ${refCount} refs`);
    }
  });
}
```

## Option 3: ctags (Universal Fallback)

### Install

```bash
# macOS
brew install universal-ctags

# Ubuntu/Debian
apt install universal-ctags

# Arch
pacman -S ctags

# Windows (scoop)
scoop install universal-ctags
```

### Generate tags

```bash
# Basic: generate tags file
ctags -R .

# JSON output (recommended for parsing)
ctags -R --fields=+ne --output-format=json .

# Specific languages only
ctags -R --languages=TypeScript,Python,Rust --fields=+ne --output-format=json .

# Exclude directories
ctags -R --exclude=node_modules --exclude=dist --exclude=.git --fields=+ne --output-format=json .
```

### JSON output format

```json
{"_type": "tag", "name": "AuthService", "path": "src/auth/service.ts", "pattern": "/^export class AuthService/", "line": 2, "kind": "class", "end": 150}
{"_type": "tag", "name": "login", "path": "src/auth/service.ts", "pattern": "/^  async login(/", "line": 5, "kind": "method", "end": 20}
{"_type": "tag", "name": "Credentials", "path": "src/auth/types.ts", "pattern": "/^interface Credentials/", "line": 1, "kind": "interface", "end": 8}
```

### Parse ctags JSON into symbols.json

```bash
#!/bin/bash
# scripts/build-symbol-index.sh

OUTPUT=".forge/cache/symbols.json"
mkdir -p .forge/cache

# Generate ctags JSON
TAGS=$(ctags -R \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  --exclude=vendor \
  --fields=+ne \
  --output-format=json \
  . 2>/dev/null)

# Transform to our format
echo "$TAGS" | python3 -c "
import json, sys, os
from collections import defaultdict

files = defaultdict(lambda: {'symbols': [], 'mtime': 0})
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        tag = json.loads(line)
        path = tag.get('path', '')
        files[path]['symbols'].append({
            'name': tag.get('name', ''),
            'kind': tag.get('kind', 'unknown'),
            'line': tag.get('line', 0)
        })
    except json.JSONDecodeError:
        pass

# Add mtimes
for path in files:
    try:
        files[path]['mtime'] = os.path.getmtime(path)
    except OSError:
        pass

# Format output
result = []
for path, data in sorted(files.items()):
    result.append({
        'file': path,
        'symbols': data['symbols'],
        'mtime': data['mtime']
    })

json.dump(result, sys.stdout, indent=2)
" > "$OUTPUT"

echo "Symbol index written to $OUTPUT"
echo "Files indexed: $(python3 -c "import json; print(len(json.load(open('$OUTPUT'))))")"
```

**Pros:**
- Universal: works với 100+ languages
- No npm/pip dependencies (binary only)
- Fast: native C implementation
- Available everywhere

**Cons:**
- Less precise than tree-sitter (regex-based for some languages)
- No reference counting
- Kind names vary by language

## Cache Strategy

### Path

```
.forge/cache/symbols.json
```

### Format

```json
[
  {
    "file": "src/auth/service.ts",
    "symbols": [
      { "name": "AuthService", "kind": "class", "line": 2 },
      { "name": "login", "kind": "method", "line": 5 },
      { "name": "validateSession", "kind": "method", "line": 22 },
      { "name": "revokeSession", "kind": "method", "line": 35 }
    ],
    "mtime": 1704067200.123
  },
  {
    "file": "src/auth/types.ts",
    "symbols": [
      { "name": "Credentials", "kind": "interface", "line": 1 },
      { "name": "Token", "kind": "type", "line": 8 }
    ],
    "mtime": 1704067180.456
  }
]
```

### Invalidation

**mtime-based:**

```python
import json, os

def load_symbol_index():
    cache_path = ".forge/cache/symbols.json"
    if not os.path.exists(cache_path):
        return None

    with open(cache_path) as f:
        index = json.load(f)

    # Check mtimes
    needs_rebuild = []
    for entry in index:
        filepath = entry["file"]
        if not os.path.exists(filepath):
            needs_rebuild.append(filepath)
            continue
        current_mtime = os.path.getmtime(filepath)
        if current_mtime > entry["mtime"]:
            needs_rebuild.append(filepath)

    if len(needs_rebuild) > 10:
        # Too many changes, full rebuild
        return None
    elif len(needs_rebuild) > 0:
        # Partial rebuild: re-index only changed files
        return rebuild_partial(index, needs_rebuild)
    else:
        # Cache is valid
        return index
```

**Full rebuild:**
- Khi `.forge/cache/symbols.json` không tồn tại
- Khi > 10 files thay đổi (cheaper to rebuild from scratch)
- Khi user chạy `ck:repo-map --rebuild`

**Partial rebuild:**
- Khi ≤ 10 files thay đổi
- Re-index chỉ các file changed
- Merge vào existing index

```python
def rebuild_partial(index, changed_files):
    # Remove old entries for changed files
    index = [e for e in index if e["file"] not in changed_files]

    # Re-index changed files
    for filepath in changed_files:
        if os.path.exists(filepath):
            symbols = extract_symbols(filepath)  # tree-sitter / ts-morph / ctags
            index.append({
                "file": filepath,
                "symbols": symbols,
                "mtime": os.path.getmtime(filepath)
            })

    # Save updated index
    with open(".forge/cache/symbols.json", "w") as f:
        json.dump(index, f, indent=2)

    return index
```

### Lookup từ cache

```python
def context(name: str, kind: str = None):
    index = load_symbol_index()
    if not index:
        return None

    results = []
    for entry in index:
        for sym in entry["symbols"]:
            if sym["name"] == name:
                if kind is None or sym["kind"] == kind:
                    results.append({
                        "file": entry["file"],
                        "name": sym["name"],
                        "kind": sym["kind"],
                        "line": sym["line"]
                    })
    return results

# Usage:
# context("AuthService") → [{ file: "src/auth/service.ts", name: "AuthService", kind: "class", line: 2 }]
```

## Method Selection Guide

| Criterion | tree-sitter-cli | ts-morph | ctags |
|---|---|---|---|
| **Language support** | 50+ (needs grammar) | TS/JS only | 100+ |
| **Accuracy** | High (AST) | Highest (TS compiler) | Medium (regex) |
| **Speed** | Fast | Medium | Fastest |
| **Install** | `npm i -g tree-sitter-cli` | `npm i ts-morph` | system package |
| **Reference counting** | No (manual) | Yes (built-in) | No |
| **Type info** | No | Yes | No |
| **Offline** | Yes (after grammar install) | Yes | Yes |
| **Best for** | Multi-language projects | TypeScript monorepos | Quick universal scan |

**Recommendation order:**
1. **TypeScript project** → ts-morph (most precise, has reference counting)
2. **Multi-language project** → tree-sitter-cli (good balance)
3. **Quick/universal** → ctags (always works, zero config)
4. **Combo** → tree-sitter for main language + ctags for others

## Integration với repo-map skill

Symbol index là input cho repo-map skill (task C6):

```
repo-map workflow:
  1. Load symbol index → .forge/cache/symbols.json
  2. If cache miss → build index (tree-sitter / ts-morph / ctags)
  3. Build reference graph from symbols
  4. Rank with PageRank (or reference count)
  5. Select top symbols within token budget
  6. Format as skeleton map
  7. Cache map at .forge/cache/repo-map.json
```

**Symbol index vs repo-map:**
- Symbol index: flat list of all symbols + locations (cheap to build, useful for lookup)
- Repo-map: ranked subset of symbols formatted as skeleton (more expensive, useful for orient)

## Integration với context-engineering skill

Context-engineering skill dùng symbol index để:

1. **Quick lookup** — khi agent cần tìm symbol, query index thay vì đọc file
2. **Dependency resolution** — biết symbol ở đâu, đọc đúng file + line range
3. **Smart context assembly** — include chỉ symbols liên quan vào context
4. **Budget guard integration** — khi budget guard cần context, dùng local index trước, GitNexus sau

```
budget-guard fallback chain (updated):
  1. Local symbol index → context(name)
  2. GitNexus context (if MCP available)
  3. GitNexus query
  4. Chunked file read
  5. Warn user
```
