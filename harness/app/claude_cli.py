"""Run a pipeline step through the Claude Code CLI.

Same contract as the Codex runner. ``claude -p --output-format stream-json`` emits:
system/init (carrying session_id), assistant (content blocks: text and tool_use), user (tool
results) and result/success with the session id and cost. Sessions resume with --resume.
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

CLAUDE_BIN = shutil.which("claude")
ALLOWED_TOOLS = ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]


def available() -> bool:
    return CLAUDE_BIN is not None


def _summarize(block: dict[str, Any]) -> tuple[str, str] | None:
    btype = block.get("type")
    if btype == "text":
        text = (block.get("text") or "").strip()
        return ("log", text) if text else None
    if btype == "tool_use":
        name = block.get("name", "tool")
        args = block.get("input", {}) or {}
        detail = (
            args.get("file_path")
            or args.get("path")
            or args.get("command")
            or args.get("pattern")
            or ""
        )
        return "tool", f"{name} {str(detail)[:160]}".strip()
    return None


async def run_prompt(
    run: runs.Run,
    project: store.Project,
    prompt: str,
    *,
    scope: str | None = None,
    resume: bool = True,
    sandbox: str = "workspace-write",  # accepted for interface parity
    model: str | None = None,
    effort: str | None = None,  # accepted for interface parity
    provider: str | None = None,  # accepted for interface parity
    output_schema: Path | None = None,
) -> str:
    if not CLAUDE_BIN:
        raise RuntimeError("claude CLI is not installed or not on PATH")

    if output_schema is not None:
        schema = output_schema.read_text()
        prompt = (
            f"{prompt}\n\nReturn ONLY a JSON object matching this schema, with no prose and no "
            f"code fence:\n{schema}"
        )

    thread_key = f"claude:{scope}" if scope else None
    session_id = project.thread_for(thread_key) if (thread_key and resume) else None

    args: list[str] = [
        CLAUDE_BIN,
        "-p",
        "--output-format",
        "stream-json",
        "--verbose",
        "--allowedTools",
        *ALLOWED_TOOLS,
        "--permission-mode",
        "acceptEdits",
        "--add-dir",
        str(project.dir),
    ]
    if session_id:
        args += ["--resume", session_id]
    if model:
        args += ["--model", model]

    runs.emit(run, "status", f"claude {'resume' if session_id else 'start'} in {project.dir.name}")

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

    last_text = ""
    result_meta: dict[str, Any] = {}

    async def pump_stderr() -> None:
        assert process.stderr
        async for raw in process.stderr:
            text = raw.decode(errors="replace").strip()
            if text:
                runs.emit(run, "log", text[:500])

    stderr_task = asyncio.create_task(pump_stderr())

    async for raw in process.stdout:
        line = raw.decode(errors="replace").strip()
        if not line.startswith("{"):
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue

        etype = event.get("type")
        if etype == "system" and event.get("subtype") == "init":
            new_id = event.get("session_id")
            if new_id and thread_key:
                project.set_thread(thread_key, new_id)
        elif etype == "assistant":
            for block in event.get("message", {}).get("content", []):
                if block.get("type") == "text":
                    last_text = block.get("text", last_text)
                summary = _summarize(block)
                if summary:
                    runs.emit(run, summary[0], summary[1][:2000])
        elif etype == "result":
            result_meta = event
            if event.get("result"):
                last_text = event["result"]

    await process.wait()
    await stderr_task

    if result_meta:
        cost = result_meta.get("total_cost_usd")
        turns = result_meta.get("num_turns")
        runs.emit(run, "status", f"{turns} turns, ${cost:.2f}" if cost else f"{turns} turns")
        if result_meta.get("is_error"):
            raise RuntimeError(result_meta.get("result") or "claude reported an error")
    if process.returncode != 0:
        raise RuntimeError(f"claude exited {process.returncode}")
    return last_text
