"""Run registry: one record per pipeline step, streamed to anyone watching."""

from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from . import store


@dataclass
class Run:
    id: str
    project_id: str
    kind: str
    scope: str | None
    status: str = "running"
    started_at: str = field(default_factory=store.now)
    ended_at: str | None = None
    events: list[dict[str, Any]] = field(default_factory=list)
    subscribers: list[asyncio.Queue] = field(default_factory=list, repr=False)

    def as_dict(self, include_events: bool = True) -> dict[str, Any]:
        data = {
            "id": self.id,
            "project_id": self.project_id,
            "kind": self.kind,
            "scope": self.scope,
            "status": self.status,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
        }
        if include_events:
            data["events"] = self.events
        return data


_runs: dict[str, Run] = {}
_project_watchers: dict[str, list[asyncio.Queue]] = {}


def create(project_id: str, kind: str, scope: str | None = None) -> Run:
    run = Run(id=uuid.uuid4().hex[:12], project_id=project_id, kind=kind, scope=scope)
    _runs[run.id] = run
    _persist(run)  # so a run interrupted by a restart is visible rather than vanishing
    _notify_project(project_id, {"type": "run_started", "run": run.as_dict(False)})
    return run


def get(run_id: str) -> Run | None:
    return _runs.get(run_id)


def for_project(project_id: str, limit: int = 50) -> list[dict[str, Any]]:
    runs = [r for r in _runs.values() if r.project_id == project_id]
    runs.sort(key=lambda r: r.started_at, reverse=True)
    return [r.as_dict(False) for r in runs[:limit]]


def emit(run: Run, kind: str, text: str, **extra: Any) -> None:
    event = {"ts": store.now(), "kind": kind, "text": text, **extra}
    run.events.append(event)
    for queue in list(run.subscribers):
        queue.put_nowait(event)


def finish(run: Run, status: str, text: str = "") -> None:
    run.status = status
    run.ended_at = store.now()
    emit(run, "status", text or status, status=status)
    _persist(run)
    _notify_project(run.project_id, {"type": "run_finished", "run": run.as_dict(False)})
    _notify_project(run.project_id, {"type": "project_updated"})


def subscribe(run: Run) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    for event in run.events:  # replay so a late watcher sees the whole run
        queue.put_nowait(event)
    run.subscribers.append(queue)
    return queue


def unsubscribe(run: Run, queue: asyncio.Queue) -> None:
    if queue in run.subscribers:
        run.subscribers.remove(queue)


def watch_project(project_id: str) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    _project_watchers.setdefault(project_id, []).append(queue)
    return queue


def unwatch_project(project_id: str, queue: asyncio.Queue) -> None:
    watchers = _project_watchers.get(project_id, [])
    if queue in watchers:
        watchers.remove(queue)


def _notify_project(project_id: str, message: dict[str, Any]) -> None:
    for queue in list(_project_watchers.get(project_id, [])):
        queue.put_nowait(message)


def _persist(run: Run) -> None:
    project = store.load(run.project_id)
    if not project:
        return
    path: Path = project.runs_dir / f"{run.id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(run.as_dict(), indent=2))


def load_persisted(project: store.Project) -> None:
    """Re-populate the registry from disk so a restart keeps run history visible."""
    if not project.runs_dir.exists():
        return
    for path in project.runs_dir.glob("*.json"):
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            continue
        if data["id"] in _runs:
            continue
        if data.get("status") == "running":  # the server died mid-run
            data["status"] = "failed"
            data.setdefault("events", []).append(
                {"ts": store.now(), "kind": "error",
                 "text": "run was interrupted — the harness restarted while it was working"}
            )
        _runs[data["id"]] = Run(
            id=data["id"],
            project_id=data["project_id"],
            kind=data["kind"],
            scope=data.get("scope"),
            status=data.get("status", "done"),
            started_at=data.get("started_at", store.now()),
            ended_at=data.get("ended_at"),
            events=data.get("events", []),
        )
