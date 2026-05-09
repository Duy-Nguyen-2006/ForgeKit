# Fallback Methods for Repo Map Generation

When tree-sitter CLI is not available or doesn't support the target language, use these alternative methods. They are ordered by accuracy — try the highest-priority available method first.

## Decision Tree

```
tree-sitter CLI available + grammar for language?
  ├─ Yes → Use tree-sitter (see aider-repomap-technique.md)
  └─ No → ast-grep available?
       ├─ Yes → Method 1: ast-grep
       └─ No → TypeScript/JavaScript project?
            ├─ Yes → Method 2: ts-morph
            └─ No → code2prompt or gitingest available?
                 ├─ Yes → Method 3: External tools
                 └─ No → Method 4: ripgrep heuristic
```

---

## Method 1: ast-grep (AST-Based)

ast-grep provides pattern-based AST search without requiring tree-sitter grammar installation. It has built-in support for many languages.

### Installation

```bash
# npm
npm install -g @ast-grep/cli

# cargo
cargo install ast-grep

# Check
ast-grep --version   # or: sg --version
```

### Language Support

TypeScript, JavaScript, Python, Rust, Go, C, C++, Java, Kotlin, Swift, C#, Ruby, Lua, Dart, Elixir, HTML, CSS, and more.

### Extraction Commands

**Classes:**
```bash
# TypeScript/JavaScript
ast-grep -p 'class $NAME { $$$ }' --json src/

# Python
ast-grep -p 'class $NAME($$$): $$$' --lang python --json src/

# Rust
ast-grep -p 'struct $NAME { $$$ }' --lang rust --json src/
ast-grep -p 'impl $NAME { $$$ }' --lang rust --json src/
```

**Functions:**
```bash
# TypeScript/JavaScript
ast-grep -p 'function $NAME($$$) { $$$ }' --json src/
ast-grep -p 'const $NAME = ($$$) => $$$' --json src/

# Python
ast-grep -p 'def $NAME($$$): $$$' --lang python --json src/

# Go
ast-grep -p 'func $NAME($$$) $$$ { $$$ }' --lang go --json src/

# Rust
ast-grep -p 'fn $NAME($$$) $$$ { $$$ }' --lang rust --json src/
```

**Interfaces & Types:**
```bash
ast-grep -p 'interface $NAME { $$$ }' --json src/
ast-grep -p 'type $NAME = $$$' --json src/
```

**Methods inside classes:**
```bash
# Need a more specific pattern or use --rule with YAML
ast-grep -p '$NAME($$$) { $$$ }' --json src/
```

### Full Pipeline with ast-grep

```bash
#!/bin/bash
# repo-map-sg.sh - Generate repo map using ast-grep

DIR="${1:-src}"
BUDGET="${2:-3000}"

# Extract all definitions
ast-grep --json \
  -p 'class $NAME { $$$ }' \
  -p 'function $NAME($$$) { $$$ }' \
  -p 'interface $NAME { $$$ }' \
  -p 'type $NAME = $$$' \
  "$DIR" 2>/dev/null | \
  # Parse JSON, extract name + file + line, count refs
  python3 -c "
import json, sys, collections
data = json.load(sys.stdin)
symbols = []
for match in data:
    name = match.get('metaVariable', {}).get('NAME', '')
    file = match.get('file', '')
    line = match.get('range', {}).get('start', {}).get('line', 0)
    if name:
        symbols.append((name, file, line))

# Count references
ref_counts = collections.Counter()
for name, file, line in symbols:
    ref_counts[name] += 1

# Sort by reference count
ranked = sorted(symbols, key=lambda x: ref_counts[x[0]], reverse=True)

# Format output
for name, file, line in ranked:
    print(f'{file}:{line}: {name} ← {ref_counts[name]} refs')
"
```

### Pros & Cons

| Aspect | Rating |
|---|---|
| Accuracy | ★★★★☆ Good AST parsing |
| Setup | ★★★★★ npm/cargo install, no grammar needed |
| Speed | ★★★★☆ Fast parallel search |
| Coverage | ★★★★☆ Many languages, not all |

---

## Method 2: ts-morph (TypeScript/JavaScript)

For TypeScript/JavaScript projects, ts-morph provides the most accurate AST parsing using the TypeScript compiler API.

### Installation

```bash
npm install ts-morph
```

### Extraction Script

```typescript
// extract-signatures.ts
import { Project, SyntaxKind } from "ts-morph";

const project = new Project({
  tsConfigFilePath: process.argv[2] || "./tsconfig.json",
});

const results: Array<{
  name: string;
  kind: string;
  file: string;
  line: number;
  signature: string;
  refs: number;
}> = [];

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath().replace(process.cwd() + "/", "");

  // Skip node_modules and generated files
  if (filePath.includes("node_modules") || filePath.includes("dist")) continue;

  sourceFile.forEachChild((node) => {
    let name = "";
    let kind = "";
    let signature = "";

    if (node.getKind() === SyntaxKind.ClassDeclaration) {
      const cls = node.asKindOrThrow(SyntaxKind.ClassDeclaration);
      name = cls.getName() || "<anonymous>";
      kind = "class";
      signature = cls.getText().split("\n")[0]; // First line only
    } else if (node.getKind() === SyntaxKind.FunctionDeclaration) {
      const fn = node.asKindOrThrow(SyntaxKind.FunctionDeclaration);
      name = fn.getName() || "<anonymous>";
      kind = "function";
      signature = fn.getText().split("\n")[0];
    } else if (node.getKind() === SyntaxKind.InterfaceDeclaration) {
      const iface = node.asKindOrThrow(SyntaxKind.InterfaceDeclaration);
      name = iface.getName();
      kind = "interface";
      signature = `interface ${name} { ... }`;
    } else if (node.getKind() === SyntaxKind.TypeAliasDeclaration) {
      const ta = node.asKindOrThrow(SyntaxKind.TypeAliasDeclaration);
      name = ta.getName();
      kind = "type";
      signature = `type ${name} = ...`;
    }

    if (name && kind) {
      const line = node.getStartLineNumber();
      // Count references using TypeScript's reference finder
      const refs = node
        .getSymbol()
        ?.getDeclarations()[0]
        ?.findReferences().length || 0;

      results.push({ name, kind, file: filePath, line, signature, refs });
    }
  });
}

// Sort by reference count descending
results.sort((a, b) => b.refs - a.refs);

// Format as repo map
let currentDir = "";
for (const r of results) {
  const dir = r.file.substring(0, r.file.lastIndexOf("/"));
  if (dir !== currentDir) {
    console.log(`${dir}/`);
    currentDir = dir;
  }
  console.log(`  ${r.file}:`);
  console.log(`    ┃ ${r.signature} ← ${r.refs} refs`);
}
```

### Running

```bash
npx ts-node extract-signatures.ts
# or compile first
npx tsc extract-signatures.ts && node extract-signatures.js
```

### Pros & Cons

| Aspect | Rating |
|---|---|
| Accuracy | ★★★★★ Full TypeScript compiler |
| Setup | ★★★☆☆ Needs ts-morph + ts-node |
| Speed | ★★★☆☆ Slower (loads full project) |
| Coverage | ★★☆☆☆ TypeScript/JavaScript only |

---

## Method 3: External Tools (code2prompt, gitingest)

When AST-based tools aren't available, use external summarization tools.

### code2prompt

```bash
# Install
cargo install code2prompt
# or
pip install code2prompt

# Generate summary
code2prompt src/ --output repo-map.md --tokens 5000

# With template for skeleton only
code2prompt src/ \
  --template .forge/templates/skeleton.hbs \
  --output .forge/cache/repo-map.md
```

**Custom Handlebars template** (`.forge/templates/skeleton.hbs`):
```handlebars
{{#each files}}
{{path}}:
{{#each definitions}}
  ┃ {{kind}} {{name}}({{params}}){{#if returnType}}: {{returnType}}{{/if}}
{{/each}}
{{/each}}
```

### gitingest

```bash
# Install
pip install gitingest
# or
pipx install gitingest

# Generate digest
gitingest /path/to/repo --output .forge/cache/repo-map.md

# With token limit
gitingest /path/to/repo --max-tokens 5000
```

### repomix (already in ForgeKit as `ck:repomix`)

```bash
# Full dump (less efficient for skeleton)
npx repomix --output .forge/cache/repo-map.md

# With include patterns
npx repomix --include "src/**/*.ts" --output .forge/cache/repo-map.md
```

**Note:** repomix/gitingest/code2prompt produce full file content, not ranked skeletons. Use them as input source and post-process to extract signatures.

### Post-processing Pipeline

```bash
# Take repomix output, extract signatures only
npx repomix --output /tmp/repo-dump.md 2>/dev/null

# Extract definitions with ripgrep
rg -n '^\s*(export\s+)?(class|function|interface|type|const)\s+\w+' \
  /tmp/repo-dump.md | \
  sed 's|/tmp/repo-dump.md:||' | \
  sort > .forge/cache/repo-map.txt
```

### Pros & Cons

| Aspect | Rating |
|---|---|
| Accuracy | ★★★☆☆ Depends on post-processing |
| Setup | ★★★★☆ Single install command |
| Speed | ★★☆☆☆ Processes entire codebase |
| Coverage | ★★★★★ Any language (text-based) |

---

## Method 4: ripgrep + Heuristics (Universal Fallback)

When no AST tool is available, use ripgrep with language-specific patterns. Least accurate but works everywhere.

### Multi-Language Patterns

```bash
#!/bin/bash
# repo-map-rg.sh - Generate repo map using ripgrep heuristics

DIR="${1:-src}"

# TypeScript/JavaScript
rg -n '^\s*(export\s+)?(default\s+)?(class|function|interface|type|enum|const|let)\s+\w+' \
  --glob '*.{ts,tsx,js,jsx}' "$DIR" 2>/dev/null

# Python
rg -n '^\s*(class|def|async\s+def)\s+\w+' \
  --glob '*.py' "$DIR" 2>/dev/null

# Rust
rg -n '^\s*(pub\s+)?(struct|enum|trait|impl|fn|mod)\s+\w+' \
  --glob '*.rs' "$DIR" 2>/dev/null

# Go
rg -n '^\s*(func|type|interface|struct)\s+\w+' \
  --glob '*.go' "$DIR" 2>/dev/null

# Java/Kotlin
rg -n '^\s*(public|private|protected)?\s*(class|interface|enum|object|fun)\s+\w+' \
  --glob '*.{java,kt}' "$DIR" 2>/dev/null

# Ruby
rg -n '^\s*(class|module|def)\s+\w+' \
  --glob '*.rb' "$DIR" 2>/dev/null

# PHP
rg -n '^\s*(class|function|interface|trait|enum)\s+\w+' \
  --glob '*.php' "$DIR" 2>/dev/null

# C/C++
rg -n '^\s*(class|struct|enum|namespace)\s+\w+' \
  --glob '*.{h,hpp,c,cpp}' "$DIR" 2>/dev/null
```

### Reference Counting with ripgrep

```bash
#!/bin/bash
# Count references for ranking

DIR="${1:-src}"

# Extract symbol names (capitalized identifiers = likely types/classes)
symbols=$(rg -o '\b([A-Z][a-zA-Z0-9]+)\b' --glob '*.{ts,tsx,js}' "$DIR" 2>/dev/null | \
  sed 's/.*://' | sort | uniq -c | sort -rn | head -50)

echo "Top 50 referenced symbols:"
echo "$symbols"
```

### Smart Heuristics

**Heuristic 1: Capitalized identifiers are likely types/classes**
```bash
rg -o '\b[A-Z][a-zA-Z0-9]+\b' --glob '*.ts' src/ | sort | uniq -c | sort -rn
```

**Heuristic 2: Exported symbols are public API (higher importance)**
```bash
rg -n 'export\s+(class|function|interface|type|const)' --glob '*.ts' src/
```

**Heuristic 3: Symbols in index/barrel files are important**
```bash
rg -n '(class|function|interface|type|const)' --glob 'index.ts' src/
```

**Heuristic 4: Test files reference important symbols**
```bash
# Find symbols used in test files → they're probably important
rg -o '\b[A-Z]\w+\b' --glob '*.test.ts' src/ | sort | uniq -c | sort -rn
```

### Full ripgrep Pipeline

```bash
#!/bin/bash
# repo-map-rg-full.sh - Complete repo map with ripgrep

DIR="${1:-src}"
BUDGET_LINES="${2:-150}"  # ~150 lines ≈ 3000 tokens

# Step 1: Extract definitions
definitions=$(rg -n \
  '^\s*(export\s+)?(default\s+)?(class|function|interface|type|enum|const|def|struct|impl|fn)\s+\w+' \
  "$DIR" 2>/dev/null)

# Step 2: Extract symbol names
symbol_names=$(echo "$definitions" | \
  rg -o '(class|function|interface|type|enum|const|def|struct|impl|fn)\s+\K\w+' | \
  sort -u)

# Step 3: Count references per symbol
echo "# Repo Map: $DIR"
echo ""

current_file=""
while IFS= read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lineno=$(echo "$line" | cut -d: -f2)
  content=$(echo "$line" | cut -d: -f3- | sed 's/^\s*//')

  # Extract symbol name from line
  sym=$(echo "$content" | rg -o '(class|function|interface|type|enum|const)\s+\K\w+' | head -1)

  # Count references
  refs=0
  if [ -n "$sym" ]; then
    refs=$(rg -c "\b${sym}\b" "$DIR" 2>/dev/null | awk -F: '{s+=$2}END{print s}')
  fi

  # Format output
  if [ "$file" != "$current_file" ]; then
    echo ""
    echo "  ${file}:"
    current_file="$file"
  fi
  echo "    ┃ ${content} ← ${refs} refs"
done <<< "$definitions" | head -n "$BUDGET_LINES"
```

### Pros & Cons

| Aspect | Rating |
|---|---|
| Accuracy | ★★☆☆☆ Heuristic, misses nested defs |
| Setup | ★★★★★ ripgrep only (usually pre-installed) |
| Speed | ★★★★★ Very fast |
| Coverage | ★★★★★ Any language with regex patterns |

---

## Method Selection Summary

| Method | Prerequisites | Accuracy | Speed | Best For |
|---|---|---|---|---|
| tree-sitter CLI | Grammar installed | 95% | Fast | Any language with grammar |
| ast-grep | npm/cargo install | 85% | Fast | Quick setup, many languages |
| ts-morph | npm install | 98% | Slow | TS/JS projects only |
| code2prompt/gitingest | cargo/pip install | 60%* | Slow | Quick overview, any language |
| ripgrep heuristic | None | 50% | Very fast | Universal fallback |

*Accuracy after post-processing

**Recommendation:** Always try tree-sitter or ast-grep first. Fall back to ripgrep only when nothing else is available. The ranking quality depends heavily on accurate reference counting, which AST tools provide much better than text-based heuristics.
