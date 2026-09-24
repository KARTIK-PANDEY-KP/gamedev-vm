"""Run a pipeline step through the Codex CLI and stream its events into a Run.

``codex exec --json`` prints JSONL: thread.started, turn.started, item.completed, turn.completed.
The thread id is kept per scope so a refinement chat resumes the same conversation instead of
re-reading the whole project every turn.
"""

from __future__ import annotations

import asyncio
import json
import shutil
from pathlib import Path
from typing import Any

from . import runs, store

# One stream-json line can carry an entire generated file, far past asyncio's 64 KiB default.
STREAM_LIMIT = 32 * 1024 * 1024

CODEX_BIN = shutil.which("codex")


class CodexUnavailable(RuntimeError):
    pass


def available() -> bool:
    return CODEX_BIN is not None


def _summarize(item: dict[str, Any]) -> tuple[str, str] | None:
    """Turn a Codex item into (kind, text) for the run log, or None to skip it."""
    item_type = item.get("type")
    if item_type == "agent_message":
        return "log", item.get("text", "")
    if item_type == "reasoning":
        text = item.get("text") or item.get("summary") or ""
        return ("log", f"thinking: {text}") if text else None
    if item_type == "command_execution":
        command = item.get("command") or item.get("parsed_cmd") or ""
        exit_code = item.get("exit_code")
        suffix = f" (exit {exit_code})" if exit_code not in (None, 0) else ""
        return "tool", f"$ {command}{suffix}"
    if item_type == "file_change":
        changes = item.get("changes") or []
        paths = ", ".join(c.get("path", "?") for c in changes) if changes else item.get("path", "?")
        return "tool", f"edited {paths}"
    if item_type == "todo_list":
        items = item.get("items") or []
        done = sum(1 for i in items if i.get("completed"))
        return "status", f"plan: {done}/{len(items)} steps done"
    if item_type == "error":
        return "error", item.get("message", "error")
    return None


async def run_prompt(
    run: runs.Run,
    project: store.Project,
    prompt: str,
    *,
    scope: str | None = None,
    resume: bool = True,
    sandbox: str = "workspace-write",
    model: str | None = None,
    effort: str | None = None,
    provider: str | None = None,
    output_schema: Path | None = None,
) -> str:
    """Run one Codex turn in the project directory. Returns the agent's last message."""
    if not CODEX_BIN:
        raise CodexUnavailable("codex CLI is not installed or not on PATH")

    thread_id = project.thread_for(scope) if (scope and resume) else None
    args: list[str] = [CODEX_BIN, "exec"]
    if thread_id:
        args += ["resume", thread_id]
    args += [
        "--json",
        "--skip-git-repo-check",
        "-C",
        str(project.dir),
        "-s",
        sandbox,
    ]
    if model:
        args += ["-m", model]
    if effort:
        args += ["-c", f'model_reasoning_effort="{effort}"']
    if provider:  # e.g. "openai" to bill an API key instead of the ChatGPT plan quota
        args += ["-c", f'model_provider="{provider}"']
    if output_schema:
        args += ["--output-schema", str(output_schema)]
    args += ["-"]  # prompt arrives on stdin

    runs.emit(run, "status", f"codex {'resume' if thread_id else 'start'} in {project.dir.name}")

    process = await asyncio.create_subprocess_exec(
        *args,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(project.dir),
        limit=STREAM_LIMIT,
    )
    assert process.stdin and process.stdout and process.stderr
    process.stdin.write(prompt.encode())
    await process.stdin.drain()
    process.stdin.close()

    last_message = ""
    usage: dict[str, Any] | None = None

    async def pump_stderr() -> None:
        assert process.stderr
        async for raw in process.stderr:
            text = raw.decode(errors="replace").strip()
            if text and not text.startswith("Reading additional input"):
                runs.emit(run, "log", text)

    stderr_task = asyncio.create_task(pump_stderr())

    async for raw in process.stdout:
        line = raw.decode(errors="replace").strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            runs.emit(run, "log", line)
            continue

        etype = event.get("type")
        if etype == "thread.started":
            new_id = event.get("thread_id")
            if new_id and scope:
                project.set_thread(scope, new_id)
        elif etype == "item.completed":
            item = event.get("item", {})
            if item.get("type") == "agent_message":
                last_message = item.get("text", last_message)
            summary = _summarize(item)
            if summary:
                runs.emit(run, summary[0], summary[1])
        elif etype == "turn.completed":
            usage = event.get("usage")
        elif etype == "turn.failed":
            runs.emit(run, "error", json.dumps(event.get("error", event)))

    await process.wait()
    await stderr_task

    if usage:
        runs.emit(
            run,
            "status",
            f"tokens in {usage.get('input_tokens', 0)} / out {usage.get('output_tokens', 0)}",
        )
    if process.returncode != 0:
        raise RuntimeError(f"codex exited {process.returncode}")
    return last_message
