# Aider RepoMap Technique

Detailed reference on the Aider repomap technique: tree-sitter parsing + PageRank ranking to generate token-efficient codebase skeleton maps.

## Core Concept

The Aider repomap technique produces a compact "skeleton" of a codebase containing only important class/function signatures ranked by how many other symbols reference them. This reduces token usage by 50-80% compared to reading full files when orienting in a codebase.

**Key insight:** Not all code is equally important. A function referenced by 20 other files is more important to show than a private helper used once. PageRank on the symbol reference graph captures this naturally.

## How It Works

### Step 1: Parse with Tree-Sitter

Tree-sitter produces a concrete syntax tree (CST) that captures every structural element. For repomap, we extract:

**Definition nodes to capture:**
- Class declarations (name, parent class, implemented interfaces)
- Function/method declarations (name, parameters, return type)
- Interface declarations (name, method signatures)
- Type aliases (name, type expression)
- Module-level constants with type annotations
- Trait/protocol declarations
- Enum declarations (name, variants)

**What to skip:**
- Import statements (captured as edges, not nodes)
- Comments
- Function/method bodies
- Variable assignments inside functions
- String literals, numbers

**Tree-sitter query example (TypeScript):**

```scm
; Class declarations
(class_declaration
  name: (type_identifier) @class_name
  (class_heritage)? @heritage) @class_def

; Function declarations
(function_declaration
  name: (identifier) @func_name
  parameters: (formal_parameters) @params
  return_type: (type_annotation)? @return_type) @func_def

; Interface declarations
(interface_declaration
  name: (type_identifier) @iface_name) @iface_def

; Type alias
(type_alias_declaration
  name: (type_identifier) @type_name) @type_def

; Method definitions inside class
(method_definition
  name: (property_identifier) @method_name
  parameters: (formal_parameters) @params) @method_def
```

**Running tree-sitter CLI:**

```bash
# Parse a file to CST
tree-sitter parse src/auth/service.ts

# Parse with query
tree-sitter query definitions.scm src/auth/service.ts

# Parse entire directory (parallel)
find src -name '*.ts' -exec tree-sitter query definitions.scm {} \;
```

### Step 2: Build Reference Graph

For each definition found, determine which other definitions it references:

**Reference types:**
- Import statements: `import { AuthService } from './service'` → edge from importer to AuthService
- Type annotations: `user: User` → edge from containing function to User
- Function calls: `authService.login()` → edge from caller to login
- Inheritance: `class Admin extends User` → edge from Admin to User
- Return types: `): Promise<Token>` → edge from function to Token

**Graph structure:**
```
Nodes: { symbol_id: { name, file, kind, line } }
Edges: { from_symbol, to_symbol, edge_type }
```

**Practical extraction with shell tools:**

```bash
# Extract imports as edges (TypeScript/JavaScript)
rg -o 'import\s+\{?\s*([A-Z]\w+)' --replace '$1' --glob '*.ts' src/

# Extract type references
rg -o '\b([A-Z]\w+)\b' --glob '*.ts' src/ | sort | uniq -c | sort -rn

# Cross-reference: which symbols are used most
rg -c 'AuthService' --glob '*.ts' src/
```

### Step 3: Rank with PageRank (or Simplified Alternative)

**Full PageRank:**

The Aider approach runs PageRank on the reference graph. PageRank assigns higher scores to symbols that are referenced by other high-scoring symbols (same principle as Google's web page ranking).

```
PR(symbol) = (1-d)/N + d * Σ(PR(referrer)/L(referrer))
```

Where:
- `d` = damping factor (0.85)
- `N` = total number of symbols
- `L(referrer)` = number of outgoing references from referrer

**Simplified ranking (no library needed):**

When PageRank libraries aren't available, use incoming reference count as a proxy:

```bash
# Count how many files reference each symbol
for symbol in $(extracted_symbols); do
  count=$(rg -l "$symbol" --glob '*.{ts,py,rs}' src/ | wc -l)
  echo "$count $symbol"
done | sort -rn
```

This is a reasonable approximation because:
- Symbols with many incoming references tend to also have high PageRank
- The correlation is ~0.7-0.9 for typical codebases
- Much simpler to implement in shell

**Multi-pass refinement:**

For better accuracy without full PageRank:
1. Count raw incoming references per symbol
2. Weight each reference by the referrer's own reference count
3. Re-rank with weighted scores
4. This approximates 1-2 iterations of PageRank

### Step 4: Select Top Symbols (Token Budget)

Given a token budget (2-5k tokens), select the highest-ranked symbols that fit:

```
selected = []
tokens_used = 0
for symbol in sorted_by_rank_desc:
  sig_tokens = estimate_tokens(format_signature(symbol))
  if tokens_used + sig_tokens <= budget:
    selected.append(symbol)
    tokens_used += sig_tokens
  else:
    break
```

**Token estimation:**
- Average signature: ~20-40 tokens
- File path header: ~5-10 tokens
- Directory grouping overhead: ~3-5 tokens per directory

**Pruning rules:**
1. Always include symbols with ≥ 5 incoming references
2. Include symbols with 2-4 references if budget allows
3. Skip symbols referenced only once (private helpers)
4. Skip test files unless explicitly requested
5. Skip generated files, vendor, node_modules, dist

### Step 5: Format Output

The map should be formatted as a tree with signatures only:

```
src/
  auth/
    service.ts:
      ┃ class AuthService  ← 12 refs
      ┃   login(credentials: Credentials): Promise<Token>
      ┃   validateSession(token: string): Promise<User>
      ┃   revokeSession(token: string): void
    middleware.ts:
      ┃ function requireAuth(req, res, next): void  ← 8 refs
    types.ts:
      ┃ interface Credentials  ← 5 refs
      ┃   email: string
      ┃   password: string
      ┃ type Token = string  ← 4 refs
  api/
    routes.ts:
      ┃ function createRouter(auth: AuthService): Router  ← 3 refs
  models/
    user.ts:
      ┃ class User  ← 6 refs
      ┃   id: string
      ┃   email: string
      ┃   role: UserRole
```

**Format rules:**
- `┃` prefix for signature lines (distinguish from file paths)
- `← N refs` shows importance rank
- Group by directory
- Alphabetical within directory
- Truncate signatures longer than 100 chars with `...`
- Skip empty directories
- Skip files with no ranked symbols

## Implementation Variants

### Variant A: tree-sitter CLI (Best)

```bash
# Install
npm install -g tree-sitter-cli
# Install grammar
tree-sitter init-config  # downloads grammars

# Parse and extract
tree-sitter query queries/typescript.scm src/**/*.ts 2>/dev/null
```

**Pros:** Accurate AST, handles all syntax correctly
**Cons:** Requires grammar per language, setup overhead

### Variant B: ast-grep (Fast Setup)

```bash
# Install
npm install -g @ast-grep/cli
# or
cargo install ast-grep

# Extract definitions
ast-grep -p 'class $NAME { $$$ }' --json src/
ast-grep -p 'function $NAME($$$) { $$$ }' --json src/
ast-grep -p 'interface $NAME { $$$ }' --json src/
```

**Pros:** Fast, pattern-based, multi-language
**Cons:** Less precise than full tree-sitter queries

### Variant C: Language-Specific Tools

| Language | Tool | Command |
|---|---|---|
| TypeScript | ts-morph | `npx ts-morph scripts/extract-sigs.ts` |
| Python | ast module | `python3 scripts/extract_sigs.py src/` |
| Rust | rust-analyzer | LSP-based, requires editor integration |
| Go | go/doc | `go doc -all ./...` |
| Java | javap | `javap -classpath . com.example.Class` |

## Cache Strategy

### Cache Location

```
.forge/cache/repo-map.json
```

### Cache Structure

```json
{
  "version": 1,
  "timestamp": "2025-01-01T00:00:00Z",
  "root_path": "/path/to/repo",
  "engine_used": "tree-sitter",
  "token_count": 3200,
  "file_mtimes": {
    "src/auth/service.ts": 1704067200.0,
    "src/auth/middleware.ts": 1704067180.0,
    "src/api/routes.ts": 1704067150.0
  },
  "ignored_patterns": ["node_modules", "dist", ".git", "vendor"],
  "map_content": "src/\n  auth/\n    service.ts:\n      ┃ class AuthService  ← 12 refs\n..."
}
```

### Invalidation Rules

1. **mtime check:** If any source file's mtime > cache timestamp → regenerate
2. **File count check:** If number of source files changed → regenerate
3. **Partial update:** If only a few files changed, re-parse only those and merge into existing map
4. **Force refresh:** User can request `--no-cache` or delete `.forge/cache/repo-map.json`

### Partial Update Algorithm

```
changed_files = [f for f in source_files if mtime(f) > cache.timestamp]
if len(changed_files) == 0:
    return cache.map_content
elif len(changed_files) <= 5:
    # Re-parse only changed files, merge into existing map
    new_defs = parse(changed_files)
    new_refs = count_references(changed_files)
    map = merge(cache.map, new_defs, new_refs)
    return map
else:
    # Too many changes, full regeneration
    return generate_full_map()
```

## Token Budget Calibration

| Repo Size | Files | Target Tokens | Approx Symbols |
|---|---|---|---|
| Small | < 50 | 1500-2000 | 30-50 |
| Medium | 50-200 | 2000-3000 | 50-100 |
| Large | 200-500 | 3000-4000 | 100-150 |
| Very Large | > 500 | 4000-5000 | 150-200 |

If budget exceeded:
1. Increase minimum ref count threshold (2 → 3 → 5)
2. Drop method-level signatures, keep only class names
3. Drop type aliases and enums
4. Consolidate small files under a single directory entry

## Comparison with Alternatives

| Method | Tokens | Accuracy | Setup |
|---|---|---|---|
| Full file read | 50-200k | 100% | None |
| repomix dump | 20-100k | 100% | npm install |
| Aider repomap | 2-5k | ~85% | tree-sitter |
| ripgrep heuristic | 3-8k | ~60% | None |
| file listing only | 0.5-1k | ~20% | None |

The repomap approach hits the sweet spot: enough context to orient, small enough to fit in any context window.
