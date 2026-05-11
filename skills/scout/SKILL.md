---
name: ck:scout
description: "Codebase exploration and file discovery"
auto_load: false
argument-hint: "[search-target] [ext]"
metadata:
  author: forgekit
  version: "1.0.0"
triggers: ["codebase mới", "explore", "inspect", "map project", "find files", "search across"]
non_triggers: ["fix", "implement", "deploy", "single file edit"]
examples: ["find authentication-related files", "map project structure", "search for all API endpoints"]
---

# Scout

Fast, token-efficient codebase scouting using parallel agents to find files needed for tasks.

## Arguments
- Default: Scout using built-in Explore subagents in parallel (`./references/internal-scouting.md`)
- `ext`: Scout using external Gemini/OpenCode CLI tools in parallel (`./references/external-scouting.md`)

## When to Use

- Beginning work on feature spanning multiple directories
- User mentions needing to "find", "locate", or "search for" files
- Starting debugging session requiring file relationships understanding
- User asks about project structure or where functionality lives
- Before changes that might affect multiple codebase parts

## Quick Start

1. Analyze user prompt to identify search targets
2. Use a wide range of Grep and Glob patterns to find relevant files and estimate scale of the codebase
3. Spawn parallel agents with divided directories
4. Collect results into concise report

## AST-based Scouting

For structural code search (finding function definitions, class patterns, component structures), use `ast-grep` instead of regex. It's formatting-immune, language-aware, and produces fewer false positives.

**Quick examples:**
```bash
sg -p 'function $NAME($$$) { $$$ }' -l ts        # Find all functions
sg -p 'class $NAME { $$$ }' -l ts                # Find all classes
sg -p 'const $NAME = ($$$) => { $$$ }' -l tsx     # Find React components
sg -p 'use$NAME($$$)' -l tsx                       # Find hook usage
```

**Decision tree:**
- Literal text search (error messages, strings, config) → `ripgrep`
- Structural code search (definitions, patterns, idioms) → `ast-grep`
- Symbol references across codebase → Serena MCP (if available), else hybrid
- Need both text AND structure → hybrid ripgrep + ast-grep

👉 Full guide: `references/ast-grep-scouting.md`

## Configuration

Read from `.forge/.ck.json`:
- `gemini.model` - Gemini model (default: `gemini-3-flash-preview`)

## Workflow

### 1. Analyze Task
- Parse user prompt for search targets
- Identify key directories, patterns, file types, lines of code
- Determine optimal SCALE value of subagents to spawn

### 2. Divide and Conquer
- Split codebase into logical segments per agent
- Assign each agent specific directories or patterns
- Ensure no overlap, maximize coverage

### 3. Register Scout Tasks
- **Skip if:** Agent count ≤ 2 (overhead exceeds benefit)
- **Skip if:** Task tools unavailable (VSCode extension) — use `TodoWrite` instead
- `TaskList` first — check for existing scout tasks in session
- If not found, `TaskCreate` per agent with scope metadata
- See `references/task-management-scouting.md` for patterns and examples

### 4. Spawn Parallel Agents
Load appropriate reference based on decision tree:
- **Internal (Default):** `references/internal-scouting.md` (Explore subagents)
- **External:** `references/external-scouting.md` (Gemini/OpenCode)

**Notes:**
- `TaskUpdate` each task to `in_progress` before spawning its agent (skip if Task tools unavailable)
- Prompt detailed instructions for each subagent with exact directories or files it should read
- Remember that each subagent has less than 200K tokens of context window
- Amount of subagents to-be-spawned depends on the current system resources available and amount of files to be scanned
- Each subagent must return a detailed summary report to a main agent

### 5. Collect Results
**IMPORTANT:** Invoke "/ck:project-organization" skill to organize the outputs.

- Timeout: 3 minutes per agent (skip non-responders)
- `TaskUpdate` completed tasks; log timed-out agents in report (skip if Task tools unavailable)
- Aggregate findings into single report
- List unresolved questions at end

## Report Format

```markdown
# Scout Report

## Relevant Files
- `path/to/file.ts` - Brief description
- ...

## Unresolved Questions
- Any gaps in findings
```

## References

- `references/internal-scouting.md` - Using Explore subagents
- `references/external-scouting.md` - Using Gemini/OpenCode CLI
- `references/task-management-scouting.md` - Claude Task patterns for scout coordination
- `references/ast-grep-scouting.md` - AST-based code search with ast-grep (structural patterns, hybrid ripgrep, decision tree)
