"""Pick which agent CLI runs a step.

Codex is the default the project chose. Claude Code is the second backend, selectable per
project, so work continues when one of them is unavailable — which is exactly what happened
the first time this pipeline ran end to end.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from . import claude_cli, codex, runs, store

RUNTIMES = {
    "codex": codex,
    "claude": claude_cli,
}
DEFAULT_ORDER = ["codex", "claude"]


def available() -> dict[str, bool]:
    return {name: module.available() for name, module in RUNTIMES.items()}


def resolve(project: store.Project | None = None, explicit: str | None = None) -> str:
    """explicit > project setting > env > first installed."""
    for candidate in (explicit, getattr(project, "runtime", None), os.environ.get("HARNESS_RUNTIME")):
        if candidate and candidate in RUNTIMES and RUNTIMES[candidate].available():
            return candidate
    for name in DEFAULT_ORDER:
        if RUNTIMES[name].available():
            return name
    raise RuntimeError("no agent runtime available — install the codex or claude CLI")


async def run_prompt(
    run: runs.Run,
    project: store.Project,
    prompt: str,
    *,
    scope: str | None = None,
    resume: bool = True,
    model: str | None = None,
    sandbox: str | None = None,
    effort: str | None = None,
    provider: str | None = None,
    output_schema: Path | None = None,
    runtime: str | None = None,
) -> str:
    name = resolve(project, runtime)
    module: Any = RUNTIMES[name]
    runs.emit(run, "status", f"runtime: {name}")
    return await module.run_prompt(
        run,
        project,
        prompt,
        scope=scope,
        resume=resume,
        model=model,
        **({"sandbox": sandbox} if sandbox else {}),
        effort=effort,
        provider=provider,
        output_schema=output_schema,
    )
