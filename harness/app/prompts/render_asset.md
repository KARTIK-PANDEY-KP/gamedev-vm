Render a presentation image of the built asset `{asset_id}` using Blender, headless.

Inputs:
- `assets/{asset_id}/build/asset.glb` — the built mesh
- `assets/{asset_id}/brief.md` — the art direction: palette with hex values, material callouts by
  zone, wear state, lighting keys. The mesh ships untextured, so the render is where the brief's
  look gets applied.
- `assets/{asset_id}/refs/*.png` — the reference images. Match their colour and material read.

What to do:

1. Read the brief's Art direction and Texture and material sections. Note the exact hex values and
   which zone each belongs to.
2. Write `assets/{asset_id}/build/render.py`. It must:
   - import the glb
   - build materials from the brief: base colour per zone from the stated hex values, roughness and
     metallic per the stated values, assigned to the right parts by object or material slot name
   - light it deliberately — a key, a fill and a rim, sized and placed to read the silhouette, with
     the mood the brief describes
   - frame the subject in a three-quarter view that shows the form, subject filling most of frame
   - render at 1600x1200, 128+ samples, with a transparent film so the asset reads on any page
   - write `assets/{asset_id}/build/render.png`
3. Run it headless with THIS executable — Blender is not on PATH:
   `"{blender_bin}" --background --python assets/{asset_id}/build/render.py`
   **Never launch the Blender GUI.** `--background` on every invocation, no exceptions.
4. If Blender exits with code 139 before any Python runs, that is an intermittent Metal backend
   probe crash on this machine, not your script. Retry the same command once; only treat it as
   a real failure if it crashes the same way twice.
5. Inspect the actual object and material names in the imported file before you rely on them.
   Do not assert an expected mesh inventory — read what is there and adapt.
6. Look at the result. If the framing crops the asset, the lighting flattens it, or a material is
   plainly wrong against the brief, fix the script and re-render. Two or three iterations is
   normal; stop when it reads clearly.
7. Write `assets/{asset_id}/build/render.json`: `{"ok": bool, "image": "render.png",
   "samples": int, "resolution": [w, h], "materials": [{"zone": str, "hex": str, "roughness": num}],
   "iterations": int, "notes": str}`.

Constraints:
- Do not modify `asset.glb`, the brief, or anything in `refs/`. This step only adds render files.
- Do not invent colours. Every hex value comes from the brief; anything you had to choose goes in
  `notes`.
- If Blender fails to run, write `render.json` with `ok: false` and the error, and stop. Do not
  produce the image any other way.

Reply with the materials you assigned, the number of iterations, and where the image landed.
