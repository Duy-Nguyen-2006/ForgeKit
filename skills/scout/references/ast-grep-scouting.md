# AST-based Scouting with ast-grep

Semantic code search using AST patterns — superior to regex for finding code structures. Pattern from OpenHands, Cline, Roo Code.

---

## Why ast-grep over Regex?

| Aspect | Regex (`fs_search` / ripgrep) | ast-grep |
|---|---|---|
| **What it matches** | Raw text / character patterns | Syntax tree nodes |
| **Formatting immune** | ❌ Breaks on whitespace changes | ✅ Ignores formatting |
| **Structural match** | ❌ Can't match "any function body" | ✅ `$NAME($$$) { $$$ }` matches all functions |
| **Refactoring safe** | ❌ False positives on comments, strings | ✅ Skips comments & strings |
| **Cross-language** | ❌ Different regex per language | ✅ Same meta-pattern, different `-l` flag |
| **Speed** | ⚡ Very fast | ⚡ Fast (incremental parsing) |

**Bottom line:** Use regex for literal text search (error messages, strings, config values). Use ast-grep for structural code search (definitions, patterns, idioms).

---

## Installation

```bash
# Node.js (recommended)
npm i -g @ast-grep/ast-grep

# Rust/Cargo
cargo install ast-grep

# Verify
sg --version
```

---

## Key Usage Patterns

### Function Definitions

```bash
# Named function declarations
sg -p 'function $NAME($$$) { $$$ }' -l ts

# Arrow functions assigned to const
sg -p 'const $NAME = ($$$) => { $$$ }' -l ts

# Async functions
sg -p 'async function $NAME($$$) { $$$ }' -l ts

# Methods in class
sg -p '$NAME($$$) { $$$ }' -l ts  # inside class body context
```

### Class Definitions

```bash
# Class declarations
sg -p 'class $NAME { $$$ }' -l ts

# Extends / implements
sg -p 'class $NAME extends $PARENT { $$$ }' -l ts

# Decorated classes
sg -p '@$DEC class $NAME { $$$ }' -l ts
```

### React Components

```bash
# Functional component (const + arrow)
sg -p 'const $NAME = ($$$) => { $$$ }' -l tsx

# JSX return patterns
sg -p 'return <$$$ />' -l tsx

# Component with props type
sg -p 'function $NAME($$$: $TYPE) { $$$ }' -l tsx

# Hook definitions
sg -p 'function use$NAME($$$) { $$$ }' -l tsx
```

### Import Patterns

```bash
# Named imports
sg -p 'import { $$$ } from $MOD' -l ts

# Default import
sg -p 'import $NAME from $MOD' -l ts

# Side-effect import
sg -p 'import $MOD' -l ts

# Dynamic import
sg -p 'import($MOD)' -l ts
```

### API / Network Calls

```bash
# fetch calls
sg -p 'fetch($URL)' -l ts

# fetch with options
sg -p 'fetch($URL, $OPTS)' -l ts

# axios patterns
sg -p 'axios.$METHOD($URL)' -l ts

# await fetch
sg -p 'await fetch($URL)' -l ts
```

### React Hook Usage

```bash
# useState
sg -p 'useState($$$)' -l tsx

# useEffect
sg -p 'useEffect($$$)' -l tsx

# Custom hooks
sg -p 'use$NAME($$$)' -l tsx

# useCallback / useMemo
sg -p 'useCallback($$$)' -l tsx
```

### Python Patterns

```bash
# Function definitions
sg -p 'def $NAME($$$): $$$' -l python

# Class definitions
sg -p 'class $NAME($$$): $$$' -l python

# Decorators
sg -p '@$DEC\ndef $NAME($$$): $$$' -l python

# Async functions
sg -p 'async def $NAME($$$): $$$' -l python
```

### Rust Patterns

```bash
# Function definitions
sg -p 'fn $NAME($$$) { $$$ }' -l rust

# Trait implementations
sg -p 'impl $TRAIT for $TYPE { $$$ }' -l rust

# Struct definitions
sg -p 'struct $NAME { $$$ }' -l rust
```

---

## Language Support

| Language | `-l` flag | Notes |
|---|---|---|
| TypeScript | `ts` | Full support |
| TypeScript (JSX) | `tsx` | React components |
| JavaScript | `js` / `jsx` | Full support |
| Python | `python` | Full support |
| Rust | `rust` | Full support |
| Go | `go` | Full support |
| Java | `java` | Full support |
| C | `c` | Full support |
| C++ | `cpp` | Full support |
| C# | `c_sharp` | Full support |
| Swift | `swift` | Full support |
| Kotlin | `kotlin` | Full support |
| Ruby | `ruby` | Full support |
| Lua | `lua` | Full support |
| HTML | `html` | Limited structural |
| CSS | `css` | Limited structural |

---

## Combining with ripgrep — Hybrid Search

ast-grep + ripgrep = best of both worlds. Use each for what it does best.

### Pattern: Structure first, then filter

```bash
# 1. Find all async functions with ast-grep
sg -p 'async function $NAME($$$) { $$$ }' -l ts --json \
  | jq -r '.matches[].file'

# 2. Then grep for specific content inside those files
rg 'TODO|FIXME|HACK' --files-matched | rg -f <(sg -p 'async function $NAME($$$) { $$$ }' -l ts --json | jq -r '.matches[].file')
```

### Pattern: Text first, then structure

```bash
# 1. Find files mentioning a specific error or config
rg -l 'DatabaseConnection' --type ts

# 2. Then ast-grep those files for structural patterns
sg -p 'class $NAME { $$$ }' -l ts $(rg -l 'DatabaseConnection' --type ts)
```

### Pattern: Parallel search in scout workflow

```bash
# Run both in parallel, merge results
(rg -l 'useAuth' --type tsx & sg -p 'useAuth($$$)' -l tsx --json | jq -r '.matches[].file') \
  | sort -u
```

---

## Decision Tree: ast-grep vs ripgrep vs GitNexus

```
What are you searching for?
│
├─ Literal text (error message, string, config value, URL)
│  └─ → ripgrep (rg) — fastest for text
│
├─ Code structure (function/class/component definition, import pattern)
│  └─ → ast-grep (sg) — structural, formatting-immune
│
├─ Symbol references across codebase (find all usages of X)
│  ├─ GitNexus MCP available?
│  │  └─ → GitNexus — best for symbol-level semantic search
│  └─ No GitNexus
│     └─ → ast-grep for definitions + ripgrep for references
│
├─ Need both text AND structure?
│  └─ → Hybrid: ripgrep for narrowing, ast-grep for structure
│
└─ Complex multi-hop query (call chain, data flow)
   ├─ GitNexus MCP available?
   │  └─ → GitNexus — built for this
   └─ No GitNexus
      └─ → ast-grep to map definitions, then manual tracing
```

### Quick Reference Table

| Search Target | Best Tool | Example Command |
|---|---|---|
| Error message in logs | `rg` | `rg "Cannot read property" --type ts` |
| All React components | `sg` | `sg -p 'const $NAME = ($$$) => { $$$ }' -l tsx` |
| All usages of `useAuth` hook | `rg` + `sg` | `rg 'useAuth' --type tsx` then `sg -p 'use$NAME($$$)' -l tsx` |
| Class extending `BaseService` | `sg` | `sg -p 'class $NAME extends BaseService { $$$ }' -l ts` |
| Files with TODO near async code | Hybrid | `rg 'TODO'` then `sg -p 'async function $NAME($$$) { $$$ }'` |
| All references to symbol `UserModel` | GitNexus | `impact(target: "UserModel", direction: "upstream")` |

---

## Integration with Scout Workflow

Add ast-grep patterns to the parallel scouting pipeline in 3 ways:

### 1. As an additional search axis in subagent prompts

When spawning parallel scout subagents, include ast-grep commands alongside ripgrep:

```
Subagent prompt template:
1. rg -l '<text-pattern>' --type <lang>     # Text search
2. sg -p '<ast-pattern>' -l <lang>           # Structure search
3. Combine results, remove duplicates
4. Return file list with brief descriptions
```

### 2. Pre-scout structural overview

Before spawning subagents, run a quick ast-grep sweep to map codebase structure:

```bash
# Count functions per file
sg -p 'function $NAME($$$) { $$$ }' -l ts --json \
  | jq -r '.matches[] | .file' | sort | uniq -c | sort -rn

# Find all exported components
sg -p 'export function $NAME($$$) { $$$ }' -l tsx
sg -p 'export const $NAME = ($$$) => { $$$ }' -l tsx
```

### 3. Post-scout verification

After collecting scout results, use ast-grep to verify findings:

```bash
# Verify all API routes found by scout
sg -p 'app.$METHOD($PATH, $$$)' -l ts $(cat scout-results.txt)
```

### Updated Scout Workflow with AST

```
1. Analyze task → identify search targets (text + structural)
2. Quick ast-grep sweep for structural overview (optional but recommended)
3. Divide codebase into segments
4. Spawn parallel subagents with BOTH rg + sg patterns
5. Collect & merge results
6. Post-scout ast-grep verification (optional)
7. Organize into report
```

---

## Tips & Pitfalls

### Tips

- **Use `$$$` (triple dollar)** for "any number of nodes" — it's the ast-grep wildcard for matching any content
- **Use `$NAME` (single dollar)** for capturing a single node — useful for extracting names
- **Add `--json`** for machine-readable output when piping to jq
- **Combine `-l` with file paths** to restrict search to specific files: `sg -p '...' -l ts src/`
- **Use `sg run --rule`** for more complex, multi-pattern rules (YAML config)

### Pitfalls

- ❌ Don't use ast-grep for literal string search — ripgrep is faster and simpler
- ❌ Don't forget the `-l` language flag — ast-grep needs to know the language to parse
- ❌ Don't expect perfect matches on heavily macro'd or generated code — ast-grep works on parsed AST
- ❌ Don't use overly specific patterns — `function handleClick(event: MouseEvent<HTMLButtonElement>) { ... }` is too specific; use `function $NAME($$$) { $$$ }` instead
