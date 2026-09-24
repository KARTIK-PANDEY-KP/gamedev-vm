# Harness API contract

The backend serves this API and the built front end. All state is files under `projects/<slug>/`.

## Project shape on disk

```
projects/<slug>/
  project.json            { id, name, idea, created_at, state }
  design/                 step one output
    vision.md  game-design.md  art-bible.md  level-design.md  audio.md
  assets/
    manifest.json         { accepted: bool, entries: [AssetEntry] }
    <asset-id>/
      brief.md
      meta.json           { id, name, class, tier, slice, derived_from[], stale: bool, images: {...} }
      refs/front.png left.png back.png right.png
      build/              asset.glb, build.log
  runs/<run-id>.json      { id, kind, scope, status, started_at, ended_at, events[] }
```

`state` is one of: `new`, `design_ready`, `manifest_ready`, `assets_ready`.

## Types

```ts
type AssetEntry = {
  id: string            // slug, stable
  name: string
  asset_class: "character" | "prop" | "kit_piece" | "environment" | "material" | "vfx" | "ui"
  tier: "hero" | "mid" | "background"
  in_slice: boolean
  derived_from: string[]   // e.g. ["art-bible.md#asset-table", "level-design.md#ruined-village"]
  has_brief: boolean
  has_images: boolean
  has_build: boolean
  stale: boolean
}

type RunEvent = {
  ts: string
  kind: "status" | "log" | "tool" | "error" | "result"
  text: string
}

type Run = {
  id: string
  project_id: string
  kind: "design" | "refine" | "manifest" | "brief" | "images" | "build"
  scope: string | null     // asset id, doc name, or null
  status: "running" | "done" | "failed"
  started_at: string
  ended_at: string | null
  events: RunEvent[]
}
```

## REST

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/projects` | — | `[{id, name, idea, state, created_at}]` |
| POST | `/api/projects` | `{name, idea}` | project |
| GET | `/api/projects/{id}` | — | `{...project, docs: [{name, title, updated_at}], manifest, assets: [AssetEntry]}` |
| DELETE | `/api/projects/{id}` | — | `{ok: true}` |
| GET | `/api/projects/{id}/docs/{doc}` | — | `{name, markdown, updated_at}` |
| PUT | `/api/projects/{id}/docs/{doc}` | `{markdown}` | `{ok: true}` — hand edits from the UI |
| POST | `/api/projects/{id}/steps/design` | — | `{run_id}` — writes the five docs |
| POST | `/api/projects/{id}/steps/manifest` | — | `{run_id}` — derives the asset list |
| POST | `/api/projects/{id}/manifest/accept` | `{entries: AssetEntry[]}` | `{ok: true}` |
| POST | `/api/projects/{id}/assets/{asset_id}/brief` | — | `{run_id}` |
| POST | `/api/projects/{id}/assets/{asset_id}/images` | `{views?: string[]}` | `{run_id}` |
| POST | `/api/projects/{id}/assets/{asset_id}/build` | — | `{run_id}` |
| GET | `/api/projects/{id}/assets/{asset_id}` | — | `{entry, brief_markdown, images: {view: url}, build: {...}}` |
| POST | `/api/projects/{id}/chat` | `{scope, message}` | `{run_id}` — scope is `design`, `design:<doc>`, `manifest`, or `asset:<asset_id>` |
| GET | `/api/projects/{id}/chat/{scope}` | — | `[{role, text, ts, run_id}]` |
| GET | `/api/runs/{run_id}` | — | `Run` |
| GET | `/api/projects/{id}/runs` | — | `[Run]` (most recent 50, events omitted) |
| GET | `/api/projects/{id}/assets/{asset_id}/refs/{view}.png` | — | image bytes |
| GET | `/api/settings` | — | `{openai_key_present: bool, codex_present: bool, blender_present: bool, image_model: {...}}` |

Cost disclosure: `POST .../images` returns `{run_id, planned_images, estimated_cost_usd}`. A bulk refinement that
would regenerate images returns the same fields before spending — the UI shows them and asks.

## WebSocket

`WS /api/ws/runs/{run_id}` — streams `RunEvent` objects as JSON lines, then closes on `status: done|failed`.
`WS /api/ws/projects/{id}` — streams `{type: "project_updated" | "run_started" | "run_finished", ...}` so open
views refresh without polling.

## Front-end views

1. **Projects** — list, plus a new-project form (name + idea textarea).
2. **Design** — the five docs as tabs, rendered markdown, editable; chat panel refines them; stale badge when a doc changed after briefs were written.
3. **Manifest** — table of derived assets (name, class, tier, slice, provenance), editable rows, accept button.
4. **Assets** — grid of asset cards with their four reference thumbnails and state badges; detail view with the brief, the four images, build output, and a chat panel scoped to that asset.
5. **Runs** — live log stream for the active run, with history.
