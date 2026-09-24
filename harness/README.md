# Harness

Turns a game idea into design docs, per-asset briefs with reference images, and built assets —
with a web UI where you watch each step and refine it by chatting.

It implements the three plans in `../plans/`:

| Step | Plan | Output |
|---|---|---|
| One | `2026-09-22-1107-feat-game-idea-to-handoff-docs-plan.md` | five design docs |
| Two | `2026-09-22-1201-feat-asset-briefs-and-references-plan.md` | asset list, per-asset brief, four reference images |
| Three | `blender-asset-agent-research.md` | a Unity-ready mesh per asset |

## Run it

```bash
cd harness
uv sync
(cd web && npm install && npm run build)
OPENAI_API_KEY=sk-... uv run uvicorn app.main:app --host 0.0.0.0 --port 8799
```

Open `http://localhost:8799`. On the VM, use the machine's address and open that port to yourself only.

For front-end work, `cd web && npm run dev` proxies `/api` to the backend on 8799.

## What it needs

| Tool | Used for | Without it |
|---|---|---|
| Codex CLI or Claude Code | every agent step | no design docs, asset list, briefs or builds |
| `OPENAI_API_KEY` | reference images (GPT Image 2.5) | briefs still work, images do not |
| Blender 5.2.2 | the build step | briefs and images are unaffected |

The UI reports each of these honestly rather than failing silently.

## Runtimes

Steps run through an agent CLI, chosen per project in `project.json` (`"runtime": "codex" | "claude"`),
falling back to whichever is installed. `HARNESS_RUNTIME` sets the default. Each scope keeps its own
session id, so a refinement chat resumes the same conversation instead of re-reading the project.

## Layout

```
app/
  main.py          FastAPI routes, websockets, serves web/dist
  store.py         projects on disk, staleness, chat history
  runner.py        picks the agent CLI
  codex.py         codex exec --json
  claude_cli.py    claude -p --output-format stream-json
  images.py        four-view generation: flare for front, sunburst for the rest
  steps.py         design · manifest · brief · images · build · refine
  prompts/         the contracts from the plans, as prompts
  schemas/         JSON schema constraining the asset list
web/               React UI (Vite, Tailwind)
```

Projects live in `../projects/<slug>/`: `design/` holds the five docs, `assets/<id>/` holds
`brief.md`, `subject.json`, `refs/*.png` and `build/`, and `runs/` keeps every run's event log.
It is all files, on purpose — read them, edit them, commit them.

## Things worth knowing

- **Reference images are style reference, not measurement.** Generated views are not orthographic
  and drift between angles. Every number comes from the brief, and each package says so.
- **Nothing generates until you accept the asset list.** A wrong list multiplies into dozens of
  wrong briefs and paid image calls.
- **Editing a design doc marks affected briefs stale.** It never regenerates them on its own;
  images cost money per call.
- **Restarting the server kills a run in flight.** The run is then marked interrupted rather than
  left looking alive.
