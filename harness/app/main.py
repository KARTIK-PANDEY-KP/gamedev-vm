"""The harness API. Serves the built front end and runs the pipeline."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any, Awaitable, Callable

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import blender, images, runner, runs, steps, store

app = FastAPI(title="gamedev harness")
WEB_DIST = Path(__file__).resolve().parents[1] / "web" / "dist"


# --- models --------------------------------------------------------------------


class CreateProject(BaseModel):
    name: str
    idea: str
    runtime: str | None = None


class DocUpdate(BaseModel):
    markdown: str


class ManifestAccept(BaseModel):
    entries: list[dict[str, Any]]


class ChatMessage(BaseModel):
    scope: str
    message: str


class RenderRequest(BaseModel):
    model: str | None = None
    effort: str | None = None
    provider: str | None = None
    runtime: str | None = None


class ImageRequest(BaseModel):
    views: list[str] | None = None
    confirmed: bool = False
    quality: str = "high"


# --- helpers -------------------------------------------------------------------


def _project(project_id: str) -> store.Project:
    project = store.load(project_id)
    if not project:
        raise HTTPException(404, f"no project {project_id}")
    runs.load_persisted(project)
    return project


def _launch(run: runs.Run, work: Callable[[], Awaitable[None]]) -> None:
    async def wrapper() -> None:
        try:
            await work()
            runs.finish(run, "done")
        except Exception as exc:  # surfaced to the UI rather than swallowed
            runs.emit(run, "error", f"{type(exc).__name__}: {exc}")
            runs.finish(run, "failed", str(exc))

    asyncio.create_task(wrapper())


# --- settings ------------------------------------------------------------------


@app.get("/api/settings")
def settings() -> dict[str, Any]:
    return {
        "openai_key_present": images.available(),
        "runtimes": runner.available(),
        "codex_present": runner.available().get("codex", False),
        "blender": blender.status(),
        "blender_present": blender.find() is not None,
        "image_model": {
            "front": images.MODEL_FAST,
            "other_views": images.MODEL_EDIT,
            "views": images.VIEWS,
        },
        "projects_root": str(store.PROJECTS_ROOT),
    }


# --- projects ------------------------------------------------------------------


@app.get("/api/projects")
def list_projects() -> list[dict[str, Any]]:
    return [p.as_dict() for p in store.list_projects()]


@app.post("/api/projects")
def create_project(body: CreateProject) -> dict[str, Any]:
    if not body.idea.strip():
        raise HTTPException(400, "an idea is required")
    project = store.create(body.name.strip() or "untitled", body.idea.strip())
    if body.runtime:
        project.runtime = body.runtime
        project.save()
    return project.as_dict()


@app.get("/api/projects/{project_id}")
def get_project(project_id: str) -> dict[str, Any]:
    project = _project(project_id)
    project.refresh_state()
    return {
        **project.as_dict(),
        "docs": project.docs(),
        "manifest": project.manifest(),
        "assets": project.assets(),
    }


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str) -> dict[str, bool]:
    store.delete(project_id)
    return {"ok": True}


# --- documents -----------------------------------------------------------------


@app.get("/api/projects/{project_id}/docs/{doc}")
def get_doc(project_id: str, doc: str) -> dict[str, Any]:
    project = _project(project_id)
    try:
        path = project.doc_path(doc)
    except KeyError:
        raise HTTPException(404, f"unknown document {doc}")
    if not path.exists():
        raise HTTPException(404, f"{doc} has not been written yet")
    return {
        "name": doc,
        "markdown": path.read_text(),
        "updated_at": store.now(),
    }


@app.put("/api/projects/{project_id}/docs/{doc}")
def put_doc(project_id: str, doc: str, body: DocUpdate) -> dict[str, Any]:
    project = _project(project_id)
    try:
        path = project.doc_path(doc)
    except KeyError:
        raise HTTPException(404, f"unknown document {doc}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body.markdown)
    affected = store.mark_stale_for(project, doc)
    project.refresh_state()
    return {"ok": True, "stale_assets": affected}


# --- steps ---------------------------------------------------------------------


@app.post("/api/projects/{project_id}/steps/design")
async def start_design(project_id: str) -> dict[str, str]:
    project = _project(project_id)
    _require_codex()
    run = runs.create(project.id, "design")
    _launch(run, lambda: steps.design(project, run))
    return {"run_id": run.id}


@app.post("/api/projects/{project_id}/steps/manifest")
async def start_manifest(project_id: str) -> dict[str, str]:
    project = _project(project_id)
    _require_codex()
    if not project.has_design():
        raise HTTPException(400, "write the design set first")
    run = runs.create(project.id, "manifest")
    _launch(run, lambda: steps.manifest(project, run))
    return {"run_id": run.id}


@app.post("/api/projects/{project_id}/manifest/accept")
def accept_manifest(project_id: str, body: ManifestAccept) -> dict[str, Any]:
    project = _project(project_id)
    manifest = project.manifest()
    manifest["entries"] = body.entries
    manifest["accepted"] = True
    manifest["accepted_at"] = store.now()
    project.save_manifest(manifest)
    project.refresh_state()
    return {"ok": True, "count": len(body.entries)}


@app.post("/api/projects/{project_id}/assets/{asset_id}/brief")
async def start_brief(project_id: str, asset_id: str) -> dict[str, str]:
    project = _project(project_id)
    _require_codex()
    if not project.manifest().get("accepted"):
        raise HTTPException(400, "accept the asset list first")
    run = runs.create(project.id, "brief", f"asset:{asset_id}")
    _launch(run, lambda: steps.brief(project, run, asset_id))
    return {"run_id": run.id}


@app.post("/api/projects/{project_id}/assets/{asset_id}/images")
async def start_images(project_id: str, asset_id: str, body: ImageRequest) -> dict[str, Any]:
    project = _project(project_id)
    if not images.available():
        raise HTTPException(400, "OPENAI_API_KEY is not set")
    planned = len(body.views or images.VIEWS)
    cost = images.estimate_cost(planned, body.quality)
    if not body.confirmed:
        return {
            "run_id": None,
            "planned_images": planned,
            "estimated_cost_usd": cost,
            "needs_confirmation": True,
        }
    run = runs.create(project.id, "images", f"asset:{asset_id}")
    runs.emit(run, "status", f"{planned} image(s), about ${cost:.2f} at {body.quality} quality")
    _launch(run, lambda: steps.generate_images(project, run, asset_id, body.views))
    return {"run_id": run.id, "planned_images": planned, "estimated_cost_usd": cost}


@app.post("/api/projects/{project_id}/assets/{asset_id}/build")
async def start_build(project_id: str, asset_id: str) -> dict[str, str]:
    project = _project(project_id)
    _require_codex()
    run = runs.create(project.id, "build", f"asset:{asset_id}")
    _launch(run, lambda: steps.build(project, run, asset_id))
    return {"run_id": run.id}


@app.post("/api/projects/{project_id}/assets/{asset_id}/render")
async def start_render(project_id: str, asset_id: str, body: RenderRequest) -> dict[str, str]:
    project = _project(project_id)
    _require_codex()
    run = runs.create(project.id, "render", f"asset:{asset_id}")
    _launch(
        run,
        lambda: steps.render(
            project,
            run,
            asset_id,
            model=body.model,
            effort=body.effort,
            provider=body.provider,
            runtime=body.runtime,
        ),
    )
    return {"run_id": run.id}


@app.get("/api/projects/{project_id}/assets/{asset_id}")
def get_asset(project_id: str, asset_id: str) -> dict[str, Any]:
    project = _project(project_id)
    entry = next((e for e in project.assets() if e["id"] == asset_id), None)
    if not entry:
        raise HTTPException(404, f"no asset {asset_id}")
    adir = project.asset_dir(asset_id)
    brief_path = adir / "brief.md"
    build_result = adir / "build" / "result.json"
    return {
        "entry": entry,
        "meta": project.asset_meta(asset_id),
        "brief_markdown": brief_path.read_text() if brief_path.exists() else None,
        "images": {
            view: f"/api/projects/{project_id}/assets/{asset_id}/refs/{view}.png"
            for view in entry.get("images", [])
        },
        "build": json.loads(build_result.read_text()) if build_result.exists() else None,
        "build_files": {
            name: f"/api/projects/{project_id}/assets/{asset_id}/build/{name}"
            for name in BUILD_FILES
            if (adir / "build" / name).exists()
        },
    }


BUILD_FILES = {
    "asset.glb": "model/gltf-binary",
    "build.log": "text/plain; charset=utf-8",
    "build.py": "text/x-python; charset=utf-8",
    "result.json": "application/json",
    "render.png": "image/png",
    "render.py": "text/x-python; charset=utf-8",
    "render.json": "application/json",
}


@app.get("/api/projects/{project_id}/assets/{asset_id}/build/{filename}")
def get_build_file(project_id: str, asset_id: str, filename: str) -> FileResponse:
    """Serve the build artifacts so the UI can show the mesh, not just its check table."""
    if filename not in BUILD_FILES:
        raise HTTPException(404, f"{filename} is not a build artifact")
    project = _project(project_id)
    path = project.asset_dir(asset_id) / "build" / filename
    if not path.exists():
        raise HTTPException(404, f"no {filename} for {asset_id}")
    return FileResponse(path, media_type=BUILD_FILES[filename])


@app.get("/api/projects/{project_id}/assets/{asset_id}/refs/{view}.png")
def get_ref_image(project_id: str, asset_id: str, view: str) -> FileResponse:
    project = _project(project_id)
    path = project.asset_dir(asset_id) / "refs" / f"{view}.png"
    if not path.exists():
        raise HTTPException(404, "no such view")
    return FileResponse(path, media_type="image/png")


# --- chat ----------------------------------------------------------------------


@app.post("/api/projects/{project_id}/chat")
async def chat(project_id: str, body: ChatMessage) -> dict[str, str]:
    project = _project(project_id)
    _require_codex()
    if not body.message.strip():
        raise HTTPException(400, "empty message")
    run = runs.create(project.id, "refine", body.scope)
    _launch(run, lambda: steps.refine(project, run, body.scope, body.message.strip()))
    return {"run_id": run.id}


@app.get("/api/projects/{project_id}/chat/{scope:path}")
def get_chat(project_id: str, scope: str) -> list[dict[str, Any]]:
    return _project(project_id).chat(scope)


# --- runs ----------------------------------------------------------------------


@app.get("/api/runs/{run_id}")
def get_run(run_id: str) -> dict[str, Any]:
    run = runs.get(run_id)
    if not run:
        raise HTTPException(404, "no such run")
    return run.as_dict()


@app.get("/api/projects/{project_id}/runs")
def project_runs(project_id: str) -> list[dict[str, Any]]:
    _project(project_id)
    return runs.for_project(project_id)


@app.websocket("/api/ws/runs/{run_id}")
async def ws_run(socket: WebSocket, run_id: str) -> None:
    await socket.accept()
    run = runs.get(run_id)
    if not run:
        await socket.send_json({"kind": "error", "text": "no such run"})
        await socket.close()
        return
    queue = runs.subscribe(run)
    try:
        while True:
            event = await queue.get()
            await socket.send_json(event)
            if event.get("kind") == "status" and event.get("status") in ("done", "failed"):
                break
    except WebSocketDisconnect:
        pass
    finally:
        runs.unsubscribe(run, queue)


@app.websocket("/api/ws/projects/{project_id}")
async def ws_project(socket: WebSocket, project_id: str) -> None:
    await socket.accept()
    queue = runs.watch_project(project_id)
    try:
        while True:
            await socket.send_json(await queue.get())
    except WebSocketDisconnect:
        pass
    finally:
        runs.unwatch_project(project_id, queue)


def _require_codex() -> None:
    if not any(runner.available().values()):
        raise HTTPException(400, "no agent runtime available — install the codex or claude CLI")


# --- static front end ----------------------------------------------------------

if WEB_DIST.exists():
    app.mount("/assets", StaticFiles(directory=WEB_DIST / "assets"), name="web-assets")

    @app.get("/{path:path}")
    def spa(path: str) -> Any:
        candidate = WEB_DIST / path
        if path and candidate.is_file():
            return FileResponse(candidate)
        index = WEB_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        return JSONResponse({"detail": "front end not built"}, status_code=404)
