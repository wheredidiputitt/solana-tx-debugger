#!/usr/bin/env python3
"""
Create a clean ZIP of the SolanaTx Debugger project for GitHub upload.
Excludes: node_modules, build artifacts, sandbox files, dev logs, .git, .env
Includes: all source code, README, LICENSE, package.json, configs
"""

import os
import zipfile
from pathlib import Path

PROJECT_ROOT = Path("/home/z/my-project")
OUTPUT_ZIP = Path("/home/z/my-project/download/solana-tx-debugger.zip")

# Directories and files to exclude (relative to project root, or by name anywhere)
EXCLUDE_DIRS = {
    ".git",
    ".next",
    ".zscripts",
    "node_modules",
    "download",
    "examples",
    "skills",
    "scripts",
    "upload",
    "db",
    "dev",
    "__pycache__",
    ".turbo",
    ".cache",
    "coverage",
    ".vscode",
    ".idea",
    "logs",
}

EXCLUDE_FILES = {
    ".env",
    "dev.log",
    "server.log",
    "bun-debug.log",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
    ".DS_Store",
    "Thumbs.db",
    "package-lock.json",
}

EXCLUDE_FILE_PATTERNS = (
    ".log",
    ".tsbuildinfo",
    ".lockb",
)

# Don't include standalone build outputs
EXCLUDE_FILENAMES_IN_SUBDIRS = {
    "log",
}


def should_exclude(path: Path, root: Path) -> bool:
    rel = path.relative_to(root)
    parts = rel.parts

    # Exclude if any path component is in EXCLUDE_DIRS
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True

    # Exclude by filename
    if path.name in EXCLUDE_FILES:
        return True

    # Exclude by pattern
    for pat in EXCLUDE_FILE_PATTERNS:
        if path.name.endswith(pat) and path.name != "bun.lock":
            return True

    # Exclude mini-services bun.lock (it's a binary lock file, regenerated on install)
    if path.name == "bun.lock" and "mini-services" in parts:
        return True

    return False


def main() -> None:
    if not PROJECT_ROOT.exists():
        raise SystemExit(f"Project root not found: {PROJECT_ROOT}")

    OUTPUT_ZIP.parent.mkdir(parents=True, exist_ok=True)
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for dirpath, dirnames, filenames in os.walk(PROJECT_ROOT):
            dp = Path(dirpath)

            # Prune excluded dirs in-place so os.walk doesn't descend into them
            dirnames[:] = [
                d for d in dirnames
                if d not in EXCLUDE_DIRS and not should_exclude(dp / d, PROJECT_ROOT)
            ]

            for filename in filenames:
                fp = dp / filename
                if should_exclude(fp, PROJECT_ROOT):
                    continue

                rel_path = fp.relative_to(PROJECT_ROOT)
                # Put everything inside a top-level folder "solana-tx-debugger"
                # so when unzipped it creates a clean project directory
                arcname = Path("solana-tx-debugger") / rel_path

                zf.write(fp, arcname)
                file_count += 1
                total_size += fp.stat().st_size

    zip_size = OUTPUT_ZIP.stat().st_size
    print(f"✓ ZIP created: {OUTPUT_ZIP}")
    print(f"  Files: {file_count}")
    print(f"  Uncompressed size: {total_size / 1024 / 1024:.1f} MB")
    print(f"  Compressed size: {zip_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
