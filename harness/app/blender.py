"""Find the Blender executable.

``which blender`` is not enough: on macOS Blender ships as an app bundle and is not on PATH,
which is why the harness reported it missing on a machine that had it installed.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
from functools import lru_cache
from pathlib import Path

ENV_VAR = "BLENDER_BIN"

CANDIDATES = [
    # macOS app bundles, newest-looking first
    "/Applications/Blender.app/Contents/MacOS/Blender",
    "~/Applications/Blender.app/Contents/MacOS/Blender",
    # Linux
    "/usr/local/bin/blender",
    "/usr/bin/blender",
    "/snap/bin/blender",
    "/opt/blender/blender",
    # Windows
    r"C:\Program Files\Blender Foundation\Blender\blender.exe",
]


def find() -> str | None:
    """Return the Blender executable path, or None. BLENDER_BIN wins when set."""
    override = os.environ.get(ENV_VAR)
    if override and Path(override).expanduser().is_file():
        return str(Path(override).expanduser())

    on_path = shutil.which("blender") or shutil.which("Blender")
    if on_path:
        return on_path

    for candidate in CANDIDATES:
        path = Path(candidate).expanduser()
        if path.is_file() and os.access(path, os.X_OK):
            return str(path)

    # macOS versioned bundles, e.g. /Applications/Blender 5.2.app
    for app in sorted(Path("/Applications").glob("Blender*.app"), reverse=True):
        candidate = app / "Contents" / "MacOS" / "Blender"
        if candidate.is_file():
            return str(candidate)
    return None


@lru_cache(maxsize=4)
def version(executable: str) -> str | None:
    """The version string Blender reports, or None when it cannot be asked."""
    try:
        result = subprocess.run(
            [executable, "--version"],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    match = re.search(r"Blender\s+(\S+(?:\s+LTS)?)", result.stdout)
    return match.group(1).strip() if match else None


def status() -> dict[str, object]:
    executable = find()
    return {
        "present": executable is not None,
        "path": executable,
        "version": version(executable) if executable else None,
    }
