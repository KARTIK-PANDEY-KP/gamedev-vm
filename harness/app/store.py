"""Project state on disk.

Everything the harness knows lives under ``projects/<slug>/`` in the repo, which is what
both plans decided: the docs and packages are files the developer can read, edit and commit.
"""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from slugify import slugify

REPO_ROOT = Path(__file__).resolve().parents[2]
PROJECTS_ROOT = REPO_ROOT / "projects"

DOC_NAMES = ["vision", "game-design", "art-bible", "level-design", "audio"]
DOC_TITLES = {
    "vision": "Vision",
    "game-design": "Game Design",
    "art-bible": "Art Bible",
    "level-design": "Level Design",
    "audio": "Audio",
}


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, indent=2))
    tmp.replace(path)


@dataclass
class Project:
    id: str
    name: str
    idea: str
    created_at: str
    state: str = "new"
    runtime: str | None = None  # "codex" | "claude"; None = auto
    threads: dict[str, str] = field(default_factory=dict)  # scope -> codex thread id

    @property
    def dir(self) -> Path:
        return PROJECTS_ROOT / self.id

    @property
    def design_dir(self) -> Path:
        return self.dir / "design"

    @property
    def assets_dir(self) -> Path:
        return self.dir / "assets"

    @property
    def runs_dir(self) -> Path:
        return self.dir / "runs"

    @property
    def chat_dir(self) -> Path:
        return self.dir / "chat"

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "idea": self.idea,
            "created_at": self.created_at,
            "state": self.state,
            "runtime": self.runtime,
            "threads": self.threads,
        }

    def save(self) -> None:
        _write_json(self.dir / "project.json", self.as_dict())

    # --- documents -------------------------------------------------------
    def doc_path(self, doc: str) -> Path:
        if doc not in DOC_NAMES:
            raise KeyError(doc)
        return self.design_dir / f"{doc}.md"

    def docs(self) -> list[dict[str, Any]]:
        out = []
        for name in DOC_NAMES:
            path = self.doc_path(name)
            if path.exists():
                stat = path.stat()
                out.append(
                    {
                        "name": name,
                        "title": DOC_TITLES[name],
                        "updated_at": datetime.fromtimestamp(
                            stat.st_mtime, timezone.utc
                        ).isoformat(timespec="seconds"),
                        "bytes": stat.st_size,
                    }
                )
        return out

    def has_design(self) -> bool:
        return all(self.doc_path(n).exists() for n in DOC_NAMES)

    # --- manifest --------------------------------------------------------
    @property
    def manifest_path(self) -> Path:
        return self.assets_dir / "manifest.json"

    def manifest(self) -> dict[str, Any]:
        return _read_json(self.manifest_path, {"accepted": False, "entries": []})

    def save_manifest(self, manifest: dict[str, Any]) -> None:
        _write_json(self.manifest_path, manifest)

    # --- assets ----------------------------------------------------------
    def asset_dir(self, asset_id: str) -> Path:
        return self.assets_dir / asset_id

    def asset_meta(self, asset_id: str) -> dict[str, Any]:
        return _read_json(self.asset_dir(asset_id) / "meta.json", {})

    def save_asset_meta(self, asset_id: str, meta: dict[str, Any]) -> None:
        _write_json(self.asset_dir(asset_id) / "meta.json", meta)

    def assets(self) -> list[dict[str, Any]]:
        entries = self.manifest().get("entries", [])
        out = []
        for entry in entries:
            asset_id = entry["id"]
            adir = self.asset_dir(asset_id)
            meta = self.asset_meta(asset_id)
            refs = adir / "refs"
            images = (
                sorted(p.name.replace(".png", "") for p in refs.glob("*.png"))
                if refs.exists()
                else []
            )
            build_dir = adir / "build"
            out.append(
                {
                    **entry,
                    "has_brief": (adir / "brief.md").exists(),
                    "has_images": bool(images),
                    "images": images,
                    "has_build": build_dir.exists() and any(build_dir.glob("*.glb")),
                    "stale": bool(meta.get("stale")),
                    "derived_from": entry.get("derived_from", []),
                }
            )
        return out

    # --- chat ------------------------------------------------------------
    def chat_path(self, scope: str) -> Path:
        return self.chat_dir / f"{slugify(scope)}.json"

    def chat(self, scope: str) -> list[dict[str, Any]]:
        return _read_json(self.chat_path(scope), [])

    def append_chat(self, scope: str, role: str, text: str, run_id: str | None = None) -> None:
        history = self.chat(scope)
        history.append({"role": role, "text": text, "ts": now(), "run_id": run_id})
        _write_json(self.chat_path(scope), history)

    # --- codex threads ---------------------------------------------------
    def thread_for(self, scope: str) -> str | None:
        return self.threads.get(scope)

    def set_thread(self, scope: str, thread_id: str) -> None:
        self.threads[scope] = thread_id
        self.save()

    def refresh_state(self) -> None:
        manifest = self.manifest()
        if self.assets() and any(a["has_brief"] for a in self.assets()):
            self.state = "assets_ready"
        elif manifest.get("entries"):
            self.state = "manifest_ready"
        elif self.has_design():
            self.state = "design_ready"
        else:
            self.state = "new"
        self.save()


def load(project_id: str) -> Project | None:
    data = _read_json(PROJECTS_ROOT / project_id / "project.json", None)
    if not data:
        return None
    return Project(
        id=data["id"],
        name=data["name"],
        idea=data["idea"],
        created_at=data["created_at"],
        state=data.get("state", "new"),
        runtime=data.get("runtime"),
        threads=data.get("threads", {}),
    )


def list_projects() -> list[Project]:
    if not PROJECTS_ROOT.exists():
        return []
    projects = []
    for child in sorted(PROJECTS_ROOT.iterdir()):
        if child.is_dir():
            project = load(child.name)
            if project:
                projects.append(project)
    return sorted(projects, key=lambda p: p.created_at, reverse=True)


def create(name: str, idea: str) -> Project:
    base = slugify(name) or "project"
    project_id = base
    suffix = 2
    while (PROJECTS_ROOT / project_id).exists():
        project_id = f"{base}-{suffix}"
        suffix += 1
    project = Project(id=project_id, name=name, idea=idea, created_at=now())
    project.dir.mkdir(parents=True, exist_ok=True)
    project.design_dir.mkdir(exist_ok=True)
    project.assets_dir.mkdir(exist_ok=True)
    project.runs_dir.mkdir(exist_ok=True)
    project.chat_dir.mkdir(exist_ok=True)
    project.save()
    return project


def delete(project_id: str) -> None:
    target = PROJECTS_ROOT / project_id
    if target.exists():
        shutil.rmtree(target)


def mark_stale_for(project: Project, doc: str) -> list[str]:
    """Mark every brief derived from ``doc`` stale. Returns the affected asset ids."""
    affected = []
    for entry in project.manifest().get("entries", []):
        sources = entry.get("derived_from", [])
        if any(src.split("#")[0] in (doc, f"{doc}.md") for src in sources):
            asset_id = entry["id"]
            adir = project.asset_dir(asset_id)
            if (adir / "brief.md").exists():
                meta = project.asset_meta(asset_id)
                meta["stale"] = True
                meta["stale_reason"] = f"{doc}.md changed at {now()}"
                project.save_asset_meta(asset_id, meta)
                affected.append(asset_id)
    return affected
