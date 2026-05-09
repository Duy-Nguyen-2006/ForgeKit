#!/usr/bin/env bash
# Build local symbol index for ForgeKit repo-map skill
# Output: .forge/cache/symbols.json
# Usage: ./scripts/build-symbol-index.sh [project-path]

set -euo pipefail

PROJECT_DIR="${1:-.}"
CACHE_DIR="$PROJECT_DIR/.forge/cache"
OUTPUT="$CACHE_DIR/symbols.json"

mkdir -p "$CACHE_DIR"

echo "Building symbol index for: $PROJECT_DIR"

# Try ctags first (universal)
if command -v ctags &>/dev/null; then
    echo "Using universal-ctags..."
    ctags -R --fields=+ne --output-format=json --languages=TypeScript,JavaScript,Python,Go,Rust,Java,C,C++ \
        --exclude=node_modules --exclude=.git --exclude=dist --exclude=build --exclude=coverage \
        "$PROJECT_DIR" 2>/dev/null | python3 -c "
import sys, json
symbols = []
for line in sys.stdin:
    try:
        entry = json.loads(line.strip())
        symbols.append({
            'name': entry.get('name', ''),
            'kind': entry.get('kind', ''),
            'file': entry.get('path', ''),
            'line': entry.get('line', 0)
        })
    except: pass
import time
output = {
    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'engine': 'ctags',
    'symbol_count': len(symbols),
    'symbols': symbols[:5000]  # cap at 5000 symbols
}
json.dump(output, open('$OUTPUT', 'w'), indent=2)
print(f'Indexed {len(symbols)} symbols → $OUTPUT')
"
    exit 0
fi

# Fallback: ripgrep heuristic
if command -v rg &>/dev/null; then
    echo "Using ripgrep heuristic (fallback)..."
    rg -n '^\s*(export\s+)?(class|function|interface|type|const|def|fn|impl|pub)\s+\w+' \
        --glob '*.{ts,tsx,js,jsx,py,rs,go,java}' \
        --glob '!node_modules' --glob '!dist' --glob '!build' --glob '!coverage' \
        "$PROJECT_DIR" 2>/dev/null | python3 -c "
import sys, json, re, time
symbols = []
pattern = re.compile(r'^(.+?):(\d+):(?:\s*(export\s+)?)(class|function|interface|type|const|def|fn|impl|pub)\s+(\w+)')
for line in sys.stdin:
    m = pattern.match(line.strip())
    if m:
        symbols.append({
            'name': m.group(5),
            'kind': m.group(4),
            'file': m.group(1),
            'line': int(m.group(2))
        })
output = {
    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'engine': 'ripgrep',
    'symbol_count': len(symbols),
    'symbols': symbols[:5000]
}
json.dump(output, open('$OUTPUT', 'w'), indent=2)
print(f'Indexed {len(symbols)} symbols → $OUTPUT')
"
    exit 0
fi

echo "ERROR: Neither ctags nor ripgrep found. Install one:"
echo "  apt install universal-ctags"
echo "  brew install universal-ctags"
echo "  apt install ripgrep"
exit 1
