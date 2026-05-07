#!/usr/bin/env python3
"""Generate Claude compatibility files."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".claude"
SKILLS = ["auto", "orchestrator", "token-efficiency", "fix", "ck-debug", "test", "code-review", "ui-ux-pro-max"]

CLAUDE_MD = """# ForgeKit for Claude

Use this compatibility export when running ForgeKit in Claude-oriented environments.

Primary compatibility command:

```text
/ck:auto <what you want>
```

ForgeCode native command remains:

```text
:ck:auto
```

Rules:

- Spec first.
- Wait for one approval gate.
- After approval, route using `skills/orchestrator/SKILL.md`.
- Enforce `skills/token-efficiency/SKILL.md`.
- Load the smallest useful skill set.
- Verify before final success report.
- Do not use context-mode.
- Do not use cavemem.
"""

COMMAND_MD = """---
description: ForgeKit Spec-first autopilot compatibility command
argument-hint: [natural-language-request]
---

# /ck:auto

Compatibility wrapper for ForgeKit Auto.

Use the rules in:

- `.claude/CLAUDE.md`
- `.claude/skills/auto/SKILL.md`
- `.claude/skills/orchestrator/SKILL.md`
- `.claude/skills/token-efficiency/SKILL.md`

Flow:

1. Draft Spec.
2. Wait for approval.
3. Implement autonomously.
4. Verify.
5. Report.
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Claude compatibility export")
    parser.add_argument("--force", action="store_true", help="overwrite existing .claude output")
    args = parser.parse_args()

    if OUT.exists():
        if not args.force:
            raise SystemExit(".claude already exists; pass --force to overwrite")
        shutil.rmtree(OUT)

    (OUT / "skills").mkdir(parents=True)
    (OUT / "commands" / "ck").mkdir(parents=True)

    for skill in SKILLS:
        src = ROOT / "skills" / skill
        if src.exists():
            shutil.copytree(src, OUT / "skills" / skill)

    (OUT / "CLAUDE.md").write_text(CLAUDE_MD)
    (OUT / "commands" / "ck" / "auto.md").write_text(COMMAND_MD)
    print(f"generated {OUT}")


if __name__ == "__main__":
    main()
