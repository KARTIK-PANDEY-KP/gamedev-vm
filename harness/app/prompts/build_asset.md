Build the 3D asset described by `assets/{asset_id}/brief.md` using Blender, headless.

Inputs you have:
- `assets/{asset_id}/brief.md` — the authority for every dimension, budget and rule
- `assets/{asset_id}/refs/*.png` — front, left, back, right reference images. They are STYLE
  reference only: generated, not orthographic, and not consistent enough to measure. Take shape
  language, proportional feel, colour and material read from them. Take every NUMBER from the brief.

What to do:

1. Read the brief. Restate to yourself the dimensions, triangle budget, pivot rule and collision
   type before writing any code.
2. Write `assets/{asset_id}/build/build.py`, a Blender Python script that models the asset from
   primitives and mesh operations. Named parts, parented sensibly. No add-ons beyond what ships
   with Blender.
3. Run it headless with THIS executable — Blender is not on PATH, so use the full path:
   `"{blender_bin}" --background --python assets/{asset_id}/build/build.py`
   Iterate on errors — the script running clean is the floor, not the goal.
4. The script must finish by:
   - applying all transforms, with the pivot where the brief says
   - checking its own work: real-world dimensions within 2% of the brief, triangle count within
     budget, no n-gons, no inverted normals, no loose geometry — print each check with its measured
     value and PASS or FAIL
   - exporting `assets/{asset_id}/build/asset.glb` with +Y up, 1 unit = 1 metre
5. If a check fails, fix the model and re-run. Never fix a check by deleting geometry or by
   loosening the check.
6. Write `assets/{asset_id}/build/build.log` with the final check output, and
   `assets/{asset_id}/build/result.json`: `{"ok": bool, "triangles": int, "dimensions_m": [x,y,z],
   "checks": [{"name": str, "measured": str, "pass": bool}], "notes": str}`.

If that executable fails to run, do not simulate the build: write `result.json` with `ok: false`
and a note saying what went wrong, and stop.

Reply with the check table and where the file landed.
