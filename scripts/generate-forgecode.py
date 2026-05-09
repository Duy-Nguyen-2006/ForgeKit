#!/usr/bin/env python3
"""Generate a ForgeCode-native .forge runtime bundle."""
from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".forge"
DIRS = ["commands", "agents", "skills", "integrations", "communication", "hooks", "scripts"]
FILES = ["forgekit.json", "AGENTS.md", ".forge.toml", "README.md", ".forgeignore", ".mcp.json.example"]
IGNORE_PATTERNS = [
    "*.test.*",
    "__pycache__",
    ".pytest_cache",
]


def copy_path(src: Path, dst: Path) -> None:
    if src.is_dir():
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns(*IGNORE_PATTERNS))
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate ForgeCode runtime export")
    parser.add_argument("--force", action="store_true", help="overwrite existing .forge output")
    args = parser.parse_args()

    if OUT.exists():
        if not args.force:
            raise SystemExit(".forge already exists; pass --force to overwrite")
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for name in FILES:
        src = ROOT / name
        if src.exists():
            copy_path(src, OUT / name)

    for name in DIRS:
        src = ROOT / name
        if src.exists():
            copy_path(src, OUT / name)

    config = OUT / "forgekit.json"
    if config.exists():
        text = config.read_text()
        text = text.replace('"nativeRuntimeDir": "."', '"nativeRuntimeDir": ".forge"')
        config.write_text(text)

    print(f"generated {OUT}")


if __name__ == "__main__":
    main()
