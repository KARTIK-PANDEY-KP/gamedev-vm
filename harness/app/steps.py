"""The pipeline steps. Each one runs in the background and streams into its Run."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from . import blender, images, prompt_build, runner, runs, store

# Blender segfaults in its Metal probe under the Codex seatbelt sandbox (exit 139 before any
# Python runs), so the Blender steps run unsandboxed. The Claude runner ignores this.
BLENDER_SANDBOX = "danger-full-access"

PROMPTS = Path(__file__).parent / "prompts"
SCHEMAS = Path(__file__).parent / "schemas"


def _prompt(name: str, **values: Any) -> str:
    text = (PROMPTS / f"{name}.md").read_text()
    for key, value in values.items():
        text = text.replace("{" + key + "}", str(value))
    return text


def _doc_mtimes(project: store.Project) -> dict[str, float]:
    return {
        name: project.doc_path(name).stat().st_mtime
        for name in store.DOC_NAMES
        if project.doc_path(name).exists()
    }


def _mark_stale_from_changes(project: store.Project, before: dict[str, float], run: runs.Run) -> None:
    after = _doc_mtimes(project)
    changed = [name for name, mtime in after.items() if before.get(name) != mtime]
    affected: list[str] = []
    for doc in changed:
        affected.extend(store.mark_stale_for(project, doc))
    if affected:
        runs.emit(
            run,
            "status",
            f"{len(affected)} brief(s) now stale: {', '.join(sorted(set(affected)))} "
            f"(changed: {', '.join(changed)}). Nothing regenerated — ask when you want them re-run.",
        )


# --- step one ------------------------------------------------------------------


async def design(project: store.Project, run: runs.Run) -> None:
    runs.emit(run, "status", "writing the five design documents")
    await runner.run_prompt(
        run,
        project,
        _prompt("design_set", idea=project.idea),
        scope="design",
        resume=False,
    )
    missing = [n for n in store.DOC_NAMES if not project.doc_path(n).exists()]
    if missing:
        raise RuntimeError(f"design set incomplete, missing: {', '.join(missing)}")
    project.refresh_state()
    runs.emit(run, "result", "design set written: " + ", ".join(store.DOC_NAMES))


# --- step two ------------------------------------------------------------------


async def manifest(project: store.Project, run: runs.Run) -> None:
    runs.emit(run, "status", "deriving the asset list from the design set")
    message = await runner.run_prompt(
        run,
        project,
        _prompt("manifest"),
        scope="manifest",
        resume=False,
        output_schema=SCHEMAS / "manifest.schema.json",
    )
    payload = _extract_json(message)
    entries = payload.get("entries", [])
    if not entries:
        raise RuntimeError("no assets derived")
    existing = {e["id"]: e for e in project.manifest().get("entries", [])}
    for entry in entries:  # keep any acceptance state the developer already set
        if entry["id"] in existing:
            entry.update({k: v for k, v in existing[entry["id"]].items() if k not in entry})
    project.save_manifest({"accepted": False, "entries": entries, "derived_at": store.now()})
    project.refresh_state()
    by_tier: dict[str, int] = {}
    for entry in entries:
        by_tier[entry["tier"]] = by_tier.get(entry["tier"], 0) + 1
    in_slice = sum(1 for e in entries if e.get("in_slice"))
    runs.emit(
        run,
        "result",
        f"{len(entries)} assets derived ({in_slice} in the first slice) — "
        + ", ".join(f"{count} {tier}" for tier, count in sorted(by_tier.items()))
        + ". Nothing is generated until you accept the list.",
    )


async def brief(project: store.Project, run: runs.Run, asset_id: str) -> None:
    entry = _entry(project, asset_id)
    runs.emit(run, "status", f"writing the brief for {entry['name']}")
    project.asset_dir(asset_id).mkdir(parents=True, exist_ok=True)
    await runner.run_prompt(
        run,
        project,
        _prompt(
            "brief",
            asset_id=asset_id,
            asset_name=entry["name"],
            asset_class=entry["asset_class"],
            tier=entry["tier"],
            in_slice=entry.get("in_slice", False),
            derived_from=", ".join(entry.get("derived_from", [])) or "unstated",
            note=entry.get("note", ""),
        ),
        scope=f"asset:{asset_id}",
        resume=False,
    )
    brief_path = project.asset_dir(asset_id) / "brief.md"
    if not brief_path.exists():
        raise RuntimeError("brief.md was not written")
    meta = project.asset_meta(asset_id)
    meta.update(
        {
            "id": asset_id,
            "name": entry["name"],
            "derived_from": entry.get("derived_from", []),
            "stale": False,
            "brief_written_at": store.now(),
        }
    )
    project.save_asset_meta(asset_id, meta)
    project.refresh_state()
    runs.emit(run, "result", f"brief written for {entry['name']}")


async def generate_images(
    project: store.Project, run: runs.Run, asset_id: str, views: list[str] | None
) -> None:
    entry = _entry(project, asset_id)
    asset_dir = project.asset_dir(asset_id)
    subject_path = asset_dir / "subject.json"
    if not subject_path.exists():
        raise RuntimeError("no subject.json — write the brief first")
    subject = json.loads(subject_path.read_text())
    style_prompt = _style_prompt(project)

    metadata = await images.generate_views(
        asset_dir=asset_dir,
        subject=subject,
        style_prompt=style_prompt,
        views=views,
        on_event=lambda kind, text: runs.emit(run, kind, text),
    )
    meta = project.asset_meta(asset_id)
    meta["images"] = metadata
    meta["images_generated_at"] = store.now()
    project.save_asset_meta(asset_id, meta)
    runs.emit(run, "result", f"{len(metadata['views'])} view(s) generated for {entry['name']}")


async def build(project: store.Project, run: runs.Run, asset_id: str) -> None:
    entry = _entry(project, asset_id)
    if not (project.asset_dir(asset_id) / "brief.md").exists():
        raise RuntimeError("no brief to build from")
    blender_bin = blender.find()
    if not blender_bin:
        raise RuntimeError(
            "Blender was not found. Set BLENDER_BIN to its executable "
            "(on macOS: /Applications/Blender.app/Contents/MacOS/Blender)"
        )
    runs.emit(run, "status", f"building {entry['name']} with {blender_bin}")
    result_path = project.asset_dir(asset_id) / "build" / "result.json"
    try:
        await runner.run_prompt(
            run,
            project,
            _prompt("build_asset", asset_id=asset_id, blender_bin=blender_bin),
            scope=f"build:{asset_id}",
            resume=False,
            sandbox=BLENDER_SANDBOX,
        )
    except RuntimeError as exc:
        # The agent can time out after the build is already finished and checked. Judge the
        # run by what is on disk, not by how the session ended.
        if not result_path.exists():
            raise
        runs.emit(run, "log", f"agent session ended early ({exc}) — artifacts are already on disk")
    if result_path.exists():
        result = json.loads(result_path.read_text())
        meta = project.asset_meta(asset_id)
        meta["build"] = result
        project.save_asset_meta(asset_id, meta)
        checks = result.get("checks", [])
        failed = [c for c in checks if not c.get("pass")]
        runs.emit(
            run,
            "result",
            f"build {'ok' if result.get('ok') else 'failed'} — "
            f"{len(checks) - len(failed)}/{len(checks)} checks passed",
        )
    else:
        runs.emit(run, "error", "no result.json was written")


async def render(
    project: store.Project,
    run: runs.Run,
    asset_id: str,
    *,
    model: str | None = None,
    effort: str | None = None,
    provider: str | None = None,
    runtime: str | None = None,
) -> None:
    """Light and render the built mesh, applying the brief's materials."""
    entry = _entry(project, asset_id)
    build_dir = project.asset_dir(asset_id) / "build"
    if not (build_dir / "asset.glb").exists():
        raise RuntimeError("nothing to render — build the asset first")
    blender_bin = blender.find()
    if not blender_bin:
        raise RuntimeError("Blender was not found. Set BLENDER_BIN to its executable")

    runs.emit(
        run,
        "status",
        f"rendering {entry['name']} with {model or 'the default model'}"
        + (f" at {effort} effort" if effort else ""),
    )
    result_path = build_dir / "render.json"
    try:
        await runner.run_prompt(
            run,
            project,
            _prompt("render_asset", asset_id=asset_id, blender_bin=blender_bin),
            scope=f"render:{asset_id}",
            resume=False,
            sandbox=BLENDER_SANDBOX,
            model=model,
            effort=effort,
            provider=provider,
            runtime=runtime,
        )
    except RuntimeError as exc:
        if not (build_dir / "render.png").exists():
            raise
        runs.emit(run, "log", f"agent session ended early ({exc}) — the image is already on disk")

    if (build_dir / "render.png").exists():
        meta = project.asset_meta(asset_id)
        meta["render"] = (
            json.loads(result_path.read_text()) if result_path.exists() else {"ok": True}
        )
        project.save_asset_meta(asset_id, meta)
        runs.emit(run, "result", f"render.png written for {entry['name']}")
    else:
        runs.emit(run, "error", "no render.png was written")


# --- refinement ----------------------------------------------------------------

SCOPE_LABELS = {
    "design": "the design set",
    "manifest": "the asset list",
}


async def refine(project: store.Project, run: runs.Run, scope: str, message: str) -> None:
    label = SCOPE_LABELS.get(scope)
    if label is None:
        if scope.startswith("design:"):
            label = f"`design/{scope.split(':', 1)[1]}.md`"
        elif scope.startswith("asset:"):
            asset_id = scope.split(":", 1)[1]
            entry = _entry(project, asset_id)
            label = f"the brief for {entry['name']} at `assets/{asset_id}/brief.md`"
        else:
            label = scope

    before = _doc_mtimes(project)
    project.append_chat(scope, "user", message, run.id)
    reply = await runner.run_prompt(
        run,
        project,
        _prompt("refine", scope_label=label, message=message),
        scope=scope,
        resume=True,
    )
    project.append_chat(scope, "assistant", reply or "(no summary returned)", run.id)
    _mark_stale_from_changes(project, before, run)
    project.refresh_state()
    runs.emit(run, "result", reply or "done")


# --- helpers -------------------------------------------------------------------


def _entry(project: store.Project, asset_id: str) -> dict[str, Any]:
    for entry in project.manifest().get("entries", []):
        if entry["id"] == asset_id:
            return entry
    raise KeyError(f"unknown asset {asset_id}")


def _style_prompt(project: store.Project) -> str:
    """Pull the locked style prompt out of the art bible; fall back to the whole style section."""
    path = project.doc_path("art-bible")
    if not path.exists():
        return "consistent game art style"
    text = path.read_text()
    match = re.search(
        r"LOCKED STYLE PROMPT\s*[—:\-]*\s*(.+?)(?:\n#{1,6}\s|\Z)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    candidate = match.group(1) if match else text[:2000]
    cleaned = prompt_build.clean_style(candidate)
    return cleaned if len(cleaned) > 40 else prompt_build.clean_style(text[:2000])


def _extract_json(message: str) -> dict[str, Any]:
    message = message.strip()
    if message.startswith("```"):
        message = re.sub(r"^```[a-zA-Z]*\n|\n```$", "", message).strip()
    try:
        return json.loads(message)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", message, re.DOTALL)
        if not match:
            raise RuntimeError(f"expected JSON, got: {message[:300]}")
        return json.loads(match.group(0))
