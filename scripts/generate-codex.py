#!/usr/bin/env python3
"""Generate Codex compatibility files."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".codex"
SKILLS = ["auto", "orchestrator", "token-efficiency", "fix", "ck-debug", "test", "code-review", "ui-ux-pro-max", "repo-map", "diff-context", "code-map", "context-engineering"]
HOOKS_DIR = ROOT / "hooks"
SCRIPTS_DIR = ROOT / "scripts"
EXTRA_FILES = [".forgeignore", ".mcp.json.example"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Codex compatibility export")
    parser.add_argument("--force", action="store_true", help="overwrite existing .codex output")
    args = parser.parse_args()

    if OUT.exists():
        if not args.force:
            raise SystemExit(".codex already exists; pass --force to overwrite")
        shutil.rmtree(OUT)
    (OUT / "skills").mkdir(parents=True)

    for skill in SKILLS:
        src = ROOT / "skills" / skill
        if src.exists():
            shutil.copytree(src, OUT / "skills" / skill)

    # v2.1.0: copy hooks and scripts directories
    if HOOKS_DIR.exists():
        shutil.copytree(HOOKS_DIR, OUT / "hooks")
    if SCRIPTS_DIR.exists():
        shutil.copytree(SCRIPTS_DIR, OUT / "scripts")

    # v2.1.0: copy extra root files
    for name in EXTRA_FILES:
        src = ROOT / name
        if src.exists():
            shutil.copy2(src, OUT / name)

    config = {
        "provider": "codex-cli",
        "name": "ForgeKit",
        "entrypoint": "/ck:auto",
        "nativeEntrypoint": ":ck:auto",
        "instructions": [
            "AGENTS.md",
            ".codex/skills/auto/SKILL.md",
            ".codex/skills/orchestrator/SKILL.md",
            ".codex/skills/token-efficiency/SKILL.md",
        ],
        "behavior": {
            "specFirst": True,
            "singleApprovalGate": True,
            "autonomousAfterApproval": True,
            "verifyBeforeFinalReport": True,
        },
        "notes": [
            "Codex uses slash-style compatibility command /ck:auto.",
            "ForgeCode native command remains :ck:auto.",
        ],
    }
    (OUT / "codex.json").write_text(json.dumps(config, indent=2) + "\n")
    print(f"generated {OUT}")


if __name__ == "__main__":
    main()
