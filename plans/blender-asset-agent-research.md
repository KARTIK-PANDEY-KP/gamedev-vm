# Research: an agent harness that turns a description + reference images into a Unity-ready Blender asset

**Date:** 2026-09-22
**Status:** research only — no implementation plan yet, no code written
**Scope:** how to structure the harness and its instructions so a Codex agent on the gamedev VM (Blender 5.2.2, Unity 6) produces a correct game asset without hallucinating. The agent never touches Unity.

---

## 0. Summary

Getting the model to write Blender Python that *runs* is close to solved. In 3DCodeBench (Blender 5.0), letting the model retry twice with the error traceback took the fraction of scripts that execute from 0.702 to 0.974. Getting the *right shape* is not solved, and adding more screenshots or more rounds of the model critiquing its own renders levels off after about two rounds.

Three things measurably help:

1. **Give the model numbers instead of making it eyeball the images.** Adding camera parameters for 4 reference views cut shape error (Chamfer) from 0.0199 to 0.0077 in 3DHarnessBench. Adding the bounding box and dimensions took it from 0.0150 to 0.0103; adding per-part centers, sizes and counts took it to 0.0099 and cut topology error from 0.905 to 0.419.
2. **Limit what code it can write.** A part-level helper API beat raw primitives 86.75% vs 67.62% IoU (MeshCoder). Worked examples in the prompt were the most consistent gain across models in 3D-CoS. Removing SceneCraft's learned function library dropped its constraint score from 88.9 to 64.5.
3. **Check it with things it cannot fake.** Self-grading is lenient, and agents stop early — GPT-5.5 stopped after one turn in 62% of P3D-Bench attempts.

The design principle that follows: **the model plans, names and writes code; tools measure and judge.**

**Caveat on the evidence:** many cited papers are 2026 preprints without peer review, several ablations use only 10 test objects, and most spatial benchmarks omit Claude. Numbers below are as reported by the authors.

---

## 1. Failure modes and their fixes

| Failure | Why it happens | Fix |
|---|---|---|
| Misreads images: proportions, counts, left/right | Vision models are weakest exactly here. ~17% accuracy on counts that contradict priors (e.g. a 5-legged dog); accuracy falls as parts get smaller; ~¾ of perspective-taking errors answer from the camera's viewpoint; models answer from the flat 2D image rather than undoing perspective | Measure with CV tools, not the model's eyes (§2) |
| Invents what isn't visible: back side, underside, real size | Nothing in the input constrains it | Spec with per-field provenance: `measured` / `observed` / `inferred` / `assumed` (§2.3) |
| Invents bpy API calls | Trained on Blender 3.x/4.x; 5.x broke a lot. ~85% of the weakest models' failures in 3DCodeBench were 4.x→5.0 changes | Pin 5.2.2, version-specific doc retrieval, cheat sheet, type-check, traceback retry (§3.1) |
| Disconnected / floating parts | No global consistency check in generated code; this is the top failure once scripts run | Code-level contact and island checks (§4.1) |
| Claims "done" when it isn't | Self-preference bias in judges; early stopping | Validator the agent can't edit + different-family critic + stop hook (§4, §5) |
| Fixes errors by deleting geometry | Error-driven refinement optimizes for "no exception" | Flag refinements that remove geometry code (LL3M observed this) |

---

## 2. Stage 1 — Spec extraction (before any modeling)

This is the highest-leverage stage. Nova3D, which builds assets as Blender code with named parts and checks measurable constraints, met 51 of 52 numeric and count constraints; the best baseline met 11 of 52.

### 2.1 Deterministic perception first

- **Segmentation:** SAM 3 with a short phrase per part ("chair leg", "handle") → one mask per instance.
- **From masks, compute in code:** instance counts, bounding-box aspect ratios, centroids (image-left/right), part-to-whole ratios.
- **Color:** k-means on masked pixels in Lab space, not the model's description.
- **Remove the background before any counting** — worth +21 points on counting accuracy.
- Detector-based checks agreed with human judgment 83% of the time, versus 88% human-to-human.

### 2.2 Recover the camera before reading proportions

1. Classify each reference: orthographic or perspective (do lines that should be parallel converge?).
2. **Orthographic** (front/side/top sheets): load as Blender image empties and measure ratios directly.
3. **Perspective:** estimate camera and metric point map with MoGe-2 or Depth Anything 3 (VGGT or Depth Anything 3 for multi-image sets; fSpy vanishing points as fallback). Build a Blender camera with matching focal length and pose, reference as background image. Take dimensions from the point map, not from pixels.
4. Orient Anything V2 can determine which way the object faces.

### 2.3 What the vision model does, and how to ask

- **Names parts, resolves ambiguity — it does not measure.**
- **Set-of-Mark:** overlay numbered SAM masks; require answers by mask ID.
- **Crop and zoom per part**, sent at native resolution. A zoom tool added 18.9 points on V* for one 7B model; Google reports 5–10% from Gemini 3 Flash's crop-and-zoom "Agentic Vision".
- **Ask for boxes/points, compute ratios in code.** Gemini returns `box_2d` as [ymin, xmin, ymax, xmax] scaled 0–1000; Claude returns pixel coordinates on the resized image.
- **Keep perception calls short.** Text chain-of-thought *lowered* spatial accuracy by ~3% on average; models also invent spatial detail when given a blank image.
- **Left/right:** state the frame explicitly ("image-left" vs "the object's own left") and re-ask on a horizontally flipped image. If the answer doesn't flip, mark low confidence (adapted from 3DSRBench FlipEval).
- **Metric size:** anchor to a known reference object (+30–40 points on 2024 models).
- **Do not trust self-reported confidence** — calibration error is often above 0.25.

### 2.4 `spec.json` shape

Parts graph. Per part: `id`, `parent`, `count` (with mask ids), bbox per view, ratios, relations (`attached_to`, `symmetric_with`), material, hex color. Plus global: front axis, overall dimensions, triangle budget, texture resolution.

- Every field carries `source: measured | observed | inferred | assumed`, the views it came from, and its evidence.
- Confidence comes from agreement between methods (SAM count matches VLM count in ≥2 views; flip test passes), never from the model's own rating.
- Hidden sides default to `inferred`. SAM 3D Objects can propose a proxy mesh for the unseen back/underside as a hypothesis; keep those fields flagged.
- The text description overrides the images only where explicit. Conflicts are logged, not silently resolved.

**A one-page spec is the cheapest place for a human to look** — far cheaper than reviewing a finished model.

---

## 3. Stage 2 — Build

### 3.1 Stop bpy API hallucination

Pin **Blender 5.2.2** and supply:

- **Cheat sheet in AGENTS.md** of the breaking changes an older-trained model will get wrong:
  - **4.0:** context dict to `bpy.ops` removed → `context.temp_override()`; Principled BSDF sockets renamed (`Specular`→`Specular IOR Level`, `Emission`→`Emission Color`, `Subsurface`→`Subsurface Weight`); `export_scene.obj`→`wm.obj_export`; crease/bevel weight became attributes; `Mesh.calc_normals` removed.
  - **4.1:** `use_auto_smooth`, `auto_smooth_angle`, `calc_normals_split` removed (Smooth by Angle is now a Geometry Nodes modifier).
  - **4.2:** `blend_method`→`surface_render_method`; EEVEE id `BLENDER_EEVEE_NEXT`.
  - **5.0:** EEVEE id back to `BLENDER_EEVEE`; `scene.node_tree`→`scene.compositing_node_group`; `material.use_nodes`/`world.use_nodes` are no-ops; Boolean `'FAST'`→`'FLOAT'`; `bgl` removed; legacy `action.fcurves` removed; `ImageFormatSettings.media_type` before `file_format`; FBX *import* → `wm.fbx_import` (export still `export_scene.fbx`); `mathutils` now float32.
  - **5.1:** Python 3.13.
  - **5.2:** `modifier["Socket_x"]` → `modifier.properties.inputs.<id>.value`.
- **Version-specific doc retrieval.** LL3M's index over 1,729 pages of Blender 4.4 docs produced 5.86 advanced operations per object vs 1.20 without, and 26% fewer errors. The official Blender Lab MCP ships `get_python_api_docs`, `search_api_docs`, `search_manual_docs`, updated to 5.2 on 2026-09-11.
- **Static check:** pyright against `fake-bpy-module-5.2` — catches nonexistent attributes, not operator kwargs, enum strings or node socket names.
- **Runtime introspection** for the rest: `bpy.ops.X.Y.get_rna_type().properties`, `bl_rna.properties`.
- **Traceback retry loop** (the 0.702→0.974 result). Most of the gain is in round 1 (Query2CAD: 53.6 → 73.2 → 76.7 → 76.7).

### 3.2 Constrain the code

- A small `assetlib`: `make_part(name, primitive, dims, location)`, mirror, array, bevel, boolean, sweep, bridge loops — named dimensions, not magic numbers.
- Worked geometric examples in the prompt (3D-CoS: o3 Chamfer 0.0608→0.0318; Qwen2.5-VL 0.0593→0.0492). Note RAG helped some models and hurt others (Qwen 0.0593→0.0665), so measure on your own set.
- Prefer the data API and bmesh over `bpy.ops`; operators whose `poll()` needs a 3D viewport fail in background mode.
- Articraft (domain toolkit + harness-validated output) ranked first in a user study where "GPT-5.5 alone ranks second to last."

### 3.3 Process

- **Stages, each gated:** blockout to spec proportions → check → detail → UV → materials (bake procedurals) → export. SEIG's staged generate-and-check beat a single loop with the same model (DINO 0.629 vs 0.561 / 0.483).
- **Caution on part-by-part generation:** 3D-CoS found it improves coverage but causes scale/placement mismatch between parts (Claude Sonnet 4: 0.0435 vs 0.0405 single-call, ~14× tokens). Prefer staged-whole over per-part-isolated.
- **Search hygiene:** keep best-so-far with fallback (BlenderAlchemy: CLIP 28.2 vs 25.8 without); 4 rounds × 8 candidates beat 32 at once and 32 sequential; always pass previous code to the refiner (LL3M rewrote from scratch otherwise); keep a recency window on context (VIGA lost already-built objects without it).
- **Headless invocation:** `blender -b --factory-startup --offline-mode -noaudio --python-exit-code 1 -P step.py`. `--python-exit-code` defaults to **0**, so exceptions do not fail the process unless set.
- **Persistent vs one-shot:** one-shot background process per step with state in the .blend is reproducible and crash-isolated; a persistent process (Blender Lab add-on server, or the `bpy` 5.2.2 PyPI wheel in your own RPC process) is faster for iteration.
- **Fixed cameras, rendered by the harness** — do not let the agent drive the viewport; resetting the viewport before screenshots measurably improved weaker agents.

---

## 4. Stage 3 — Verification

### 4.1 Deterministic gates (the harness runs its own copy; the agent gets a read-only copy)

Geometry and spec:

- dimensions vs spec within tolerance; part/island counts; symmetry
- floating/disconnected parts and ground contact (top failure once code runs)
- triangle budget; transforms applied (rot 0, scale 1, no negative scale); pivot; facing direction
- zero loose/wire geometry, degenerate faces (<1e-8 m²), degenerate edges (<1e-5 m), duplicate verts (1e-5)
- consistent winding (`not e.is_contiguous` = 0), positive signed volume for closed meshes
- zero n-gons after export; `Mesh.validate()`
- UV layer present, no NaN, UV0 in [0,1] with no overlapping texels (rasterize UV triangles into a ≥1024² grid)
- material node allow-list; no empty slots; all images resolve and `has_data`
- textures power-of-two, ≤4096 (≤2048 mobile), multiples of 4, lossless PNG/TGA
- color space: BaseColor/Emission sRGB, normal and mask maps Non-Color

Export-level:

- FBX parsed with `io_scene_fbx.parse_fbx`: `UnitScaleFactor==100`, `UpAxis==1`, per-mesh `Lcl Rotation≈0` / `Lcl Scaling≈1`, binary, normals present, bounds 1e-4..1000 m
- round trip: re-import with `bpy.ops.wm.fbx_import` into an empty scene; compare dimensions (±1 mm), triangle count, material slots, UV layers, bones, action names
- GLB twin passes Khronos `gltf_validator` with `numErrors==0`; gate on `totalTriangleCount`, `materialCount`, `maxUVs`, `maxInfluences≤4`

Existing validators worth porting: Khronos glTF-Validator, fbx-sanitizer (MIT, Rust; Unity orientation/units), 3D Print Toolbox (non-manifold, BVHTree self-intersection, degenerate), MeshLint, Unity Asset Store Tools validator.

### 4.2 Render-and-compare

- Render from each recovered reference camera **plus** canonical orthographic views, same resolution, with a mask pass.
- Gates: silhouette IoU and contour Chamfer per view; per-part IoU by re-running SAM 3 on renders with the same prompts; part counts; aspect-ratio error; palette ΔE2000.
- Overall similarity: SigLIP-2 (r=0.964) and DINOv3 (ρ=0.972) tracked human arena rankings at system level; DreamSim agrees with human similarity judgments 96% of the time. **Do not use CLIP similarity** — τ≈0.21 with humans for image-to-3D. LPIPS only once the camera matches exactly.
- Evidence that vision-in-the-loop matters: removing SceneCraft's render-critique loop cost 38.4 constraint points; removing vision from BlenderAlchemy dropped CLIP 28.2→25.7.
- Evidence that it plateaus: 3DCodeBench found a full coding-agent harness did not improve shape quality once code ran (SigLIP −0.010, Chamfer +0.001); IR3D-Bench found agents "quickly plateau in self-correction" because they can't see fine differences (color recognition 93–98, IoU 0.08–0.11).
- **Conclusion:** the loop pays only when each round brings *new evidence* (poses, measurements, checklist), not more screenshots.

### 4.3 The critic

- **Different model family from the generator.** Every multimodal judge tested favored its own outputs (bias up to 3.02; Gemini-2.5-Pro 2.64); an ensemble of 5 judges cut it to 0.15.
- **Pairwise, side-by-side, same camera.** Pairwise matches humans; absolute scoring and batch ranking do not. Randomize and swap order; keep only verdicts stable under both orders.
- **Checklist from the spec (DSG-style):** one atomic yes/no question per spec field, must cite part id, view and box. CADCodeVerify's self-generated checks cut point-cloud distance 0.155→0.127 and raised success ~5%; no gain after 2 rounds.
- **Offer an "Unclear" option** (CADCodeVerify) — self-answers were only 64.6–68.2% correct without it.
- **Force at least N suspected discrepancies**; some models default to "no difference" (Grok 4.3 scored 5% on appear/disappear).
- **Strip the generator's claims** from the judge's input (sycophancy and self-preference are measured).
- **A failed metric gate overrides any critic "pass".**
- Calibration: BlenderGym's best VLM checker matched human judgment 66% of the time (chance 50%); one model always preferred the second candidate. Spending budget on verification rather than more candidates wins at larger budgets.
- **Cap at 2–3 rounds** and return failures rather than loop.

---

## 5. Stage 4 — Unity-ready export

Unity import options live in Unity, not in the file. So either the asset imports correctly under Unity's **defaults**, or a human installs one `AssetPostprocessor` in the project once. Decide this before writing gates.

### 5.1 Format

- **FBX is the deliverable.** Native import; `_LOD0/_LOD1` sibling names become a LODGroup; Humanoid/Mecanim supported; Asset Store accepts only .fbx/.dae/.abc/.obj.
- glTF requires `com.unity.cloud.gltfast` (v6.17.0, Mar 2026, not built in), imports onto `Shader Graphs/glTF-pbrMetallicRoughness` rather than URP Lit, partial Mecanim, 2 UV sets.
- **Export a GLB twin anyway** as a validation artifact (Khronos validator).
- **Ship loose PNGs + a material manifest JSON.** URP's FBX importer maps only DiffuseColor→`_BaseMap`, NormalMap→`_BumpMap`, emissive, and Shininess→a scalar smoothness; it **drops metallic and roughness maps**.

### 5.2 Exporter settings

Static meshes:

```
global_scale=1.0, apply_unit_scale=True, apply_scale_options='FBX_SCALE_UNITS',
axis_forward='-Z', axis_up='Y', use_space_transform=True, bake_space_transform=True,
use_mesh_modifiers=True, mesh_smooth_type='OFF', use_triangles=True,
add_leaf_bones=False, path_mode='COPY', object_types={'MESH','EMPTY','ARMATURE'}
```

- `bake_space_transform` is documented as experimental and broken with armatures/animations → **rigs use `bake_space_transform=False`**, plus either a Unity preset with `bakeAxisConversion=true` or accepting the −90° root rotation. Also `use_armature_deform_only=True`, default bone axes Y/X.
- GLB: `export_format='GLB', export_yup=True, export_apply=True` (default is False), `export_influence_nb=4, export_all_influences=False, export_animation_mode='ACTIONS'`.
- Assert each kwarg exists at runtime — the bundled add-on versions drift.

### 5.3 Scene conventions

- Metric, `scale_length==1.0`, 1 unit = 1 m.
- Front faces Blender **−Y** → Unity **+Z** (Asset Store rule 2.4.d).
- Props: origin bottom-center (`bbox.min.z≈0`, `center.xy≈0` ±1 mm). Modular kits pivot on a grid corner.
- Triangulate **before** baking normal maps so the tangent basis matches.
- Normals baked into the export; Smooth-by-Angle only exports with `use_mesh_modifiers=True`.
- Naming: `^[A-Z][A-Za-z0-9_]*$`, unique, no `.001`, prefixes SM_/SK_/T_/M_.

### 5.4 Textures and materials

- Node allow-list: Principled BSDF, Image Texture, Normal Map (Tangent), Separate Color, UV Map, Output, glTF Material Output. Anything procedural must be baked.
- Normal maps OpenGL/Y+ (`render.bake.normal_g=='POS_Y'`) — the glTF and Unity convention.
- One mask texture serves both pipelines: **R=metallic, G=AO, B=detail, A=smoothness (1−roughness)**; URP Lit reads r/a/g, HDRP MaskMap uses the same layout. The GLB needs ORM instead (R=AO, G=roughness, B=metallic).
- Encode texture type in the filename suffix (`_N`, `_Mask`) so a postprocessor can set sRGB off.
- Materials: 1 for props, ≤3 for characters (each is a submesh and a draw call).

### 5.5 Budgets, LODs, colliders (project choice)

| Asset | Mobile | PC/console |
|---|---|---|
| Prop | 100–500 tris | 500–3k |
| Environment tile | 500–2k | 2k–15k |
| Hero character | 5k–15k | 30k–80k |

- Quest-class frame totals: ~600k–1M tris, 80–200 draw calls.
- LODs: `Name_LOD0..LODn` siblings under one empty, ≤8 levels, strictly decreasing tris (~100/50/20%), same pivot, bounds within ±1%.
- Colliders: Unity has no UCX_ convention. Either the "Generate Colliders" import option (static only) or a separate `*_Collider` convex mesh ≤255 triangles converted by a postprocessor.

### 5.6 Rigs (if in scope)

Armature transforms applied, scale 1, no leaf bones; ≤4 normalized weights per vertex, every vertex weighted; Humanoid needs ≥15 bones, hips as root, T-pose rest, consistent L/R naming; one Action per clip pushed to NLA, `bake_anim_use_all_actions=True`; apply other modifiers before exporting shape keys (`use_mesh_modifiers` blocks shape-key export).

---

## 6. Codex harness

### 6.1 Invocation

`codex exec` on the VM is the best-documented route. OpenAI's Agents API (public beta, launched 2026-09-10) can run the same harness as a managed service with `environment.type: "self_hosted"` and `codex exec-server --remote … --environment-id …`, requiring outbound access to `api.openai.com` and `wss://codex-cloud-environments.chatgpt.com`; US data residency only, no ZDR, and sandboxing on a self-hosted VM appears to be the operator's responsibility.

```bash
CODEX_HOME=/opt/assetbot/codex-home timeout 60m codex exec \
  --cd /jobs/$J/work \
  --sandbox workspace-write -c approval_policy='"never"' \
  -m <pinned-model> -c model_reasoning_effort='"high"' \
  -i /jobs/$J/refs/front.png,/jobs/$J/refs/side.png \
  --output-schema /opt/assetbot/report.schema.json \
  -o /jobs/$J/out/report.json \
  --json - < /jobs/$J/prompt.md > /jobs/$J/logs/events.jsonl
```

- `-i/--image` takes a comma list or repeats; `--json` streams JSONL events; `-o` writes the final message; `-` reads the prompt from stdin; `exec` defaults to a **read-only** sandbox.
- `--full-auto` is deprecated; `--ask-for-approval` accepts only `on-request | never`.
- Critic rounds: `codex exec resume <SESSION_ID> "<feedback>"`. Do **not** pass `--ephemeral` (it prevents session save, so resume fails).
- `git init` the work dir (or `--skip-git-repo-check`) so the agent can checkpoint.
- `--output-schema` is strict mode: every object needs `additionalProperties:false`, every property listed in `required`, optionals nullable. Validate `report.json` in the harness regardless (a past bug produced broken JSON when MCP tools were active).
- **Pin the model explicitly** — the default has changed recently and not every account has the same one.

### 6.2 Config (`$CODEX_HOME/config.toml`)

```toml
sandbox_mode = "workspace-write"
approval_policy = "never"
web_search = "disabled"
[sandbox_workspace_write]
network_access = false
[tools]
view_image = true          # lets the agent re-inspect refs and its own renders
[features]
hooks = true
```

- Per-path permission profiles (`[permissions.<name>.filesystem]`, `[permissions.<name>.network]`) exist in recent versions — verify on your installed version.
- `/etc/codex/requirements.toml` can pin allowed sandbox modes, approval policies, MCP servers and managed hooks.
- `features.shell_tool = false` removes the shell entirely; `developer_instructions` injects extra instructions.

### 6.3 Tool surface

- **Codex's sandbox covers shell commands and their children — MCP servers run outside it.**
- Preferred: keep the shell in `workspace-write` with no network, expose **one wrapper CLI** (`assetctl build|render|validate|export`), and deny everything else with a `PreToolUse` hook (`permissionDecision:"deny"` or exit 2).
- Alternative: `shell_tool = false` plus your own 4–5-tool MCP server, isolated yourself (separate user, `bwrap --unshare-net`, or a container).
- **Avoid the community blender-mcp** (`ahujasid`) in production: unauthenticated socket, `execute_blender_code`, asset-download tools, telemetry on by default. The **official Blender Lab MCP** is the better reference (needs 5.1+, has doc search, warns to run in a VM).
- Tool design: few consolidated tools, clear names, compact outputs, actionable error messages.

### 6.4 Instructions

- **AGENTS.md** ~100 lines acting as a table of contents (hierarchy: `~/.codex/AGENTS.md` then repo root down to cwd, concatenated, 32 KiB cap via `project_doc_max_bytes`). Verify what loaded with `codex --ask-for-approval never "Summarize the current instructions."`
- **Skill** at `.agents/skills/blender-asset/SKILL.md` (frontmatter `name`, `description`) with `scripts/`, `references/`. Only names and descriptions load until used (~8k chars).
- **Prompting:** lead with the outcome and the definition of done; lean prompts scored 10–15% higher; avoid absolutes; do **not** ask for an upfront plan or running status updates (Codex stops early); tell it to carry the task end-to-end and to write down assumptions rather than invent details; state which source wins when text and images disagree.

### 6.5 Loop control

- **Stop hook** (`$CODEX_HOME/hooks.json`): run the validator; on failure return `{"decision":"block","reason":"<failures>"}` so Codex continues with that as its next prompt. Stop blocking after N attempts. Unmanaged hooks need trust — verify behavior in `exec`.
- **Progress outside the conversation:** `progress.json` generated from the spec, every item `passes:false` until the harness validator flips it; short `NOTES.md`; git commits at checkpoints.
- **Final report schema:** `status` enum, per-spec-item `evidence_path`, `assumptions[]`, `unresolved_ambiguities[]`, validator summary. Reject reports whose claims don't match the harness's own validator run. Hash-check spec and validator files.
- **Budgets:** wall-clock `timeout`, token caps, max critic rounds.

---

## 7. Make it or find it

- **Route by asset type.** Hard-surface and dimensioned assets (furniture, props, weapons, architecture) → code modeling. Organic and sculptural (creatures, characters, rocks) → code modeling is weak (MeshCoder's own stated limitation; Nova3D loses to TRELLIS.2 on characters) → image-to-3D, then agent cleanup in Blender, then the same gates.
- **Cleanup path:** decimate/remesh → re-UV → bake high-to-low with Cycles (works headless) → remove lighting baked into textures.
- **Options and licensing (clear before depending on any):**
  - **TRELLIS.2** (MIT code) depends on **nvdiffrast, which is non-commercial** — needs legal review. Linux + ≥24 GB NVIDIA.
  - **Hunyuan3D 2.1** open weights but the license **excludes the EU, UK and South Korea**, caps at 1M MAU; 2.5/3.x appear API-only.
  - **TripoSG** MIT, shape only, `--faces` limit, 8 GB VRAM.
  - **SF3D / SPAR3D** ~6 GB, UV-unwrapped output with built-in remesh to a vertex target; Stability Community License (free commercial under $1M revenue).
  - **SAM 3D Objects** (SAM License, 32 GB GPU) for cluttered real photos.
  - **Rodin API:** quad meshes 4k–50k faces, up to 5 input images, **bounding-box constraints** (useful for proportions). **Meshy API:** remesh to a target polycount.
- **From a single view the back is a guess** — always supply multiple views.
- If "find it online" is allowed, make it a harness-side tool against allow-listed CC0 sources (Poly Haven etc.) that records the license — not free browsing by the agent.

---

## 8. Ask more of the job input

Explicit numbers were the single biggest measured gain, so the job template should carry:

- at least one real dimension (everything else can be ratios)
- which image is which view — orthographic front/side/top plus one perspective is ideal
- front direction
- target platform, triangle budget, texture resolution
- asset class (prop / modular / character) → selects pivot convention, budget, collider rule

Anything missing becomes a **logged assumption**, not a silent guess.

---

## 9. Open questions to settle before building

1. **Unity side:** design for Unity defaults, or install one `AssetPostprocessor` in the project? This changes the lightmap-UV, sRGB and material gates.
2. **Headless rendering on this VM:** does EEVEE work over EGL without Xvfb on the GPU, and which `--gpu-backend` does 5.2 pick on Linux? Cycles CPU is the guaranteed fallback. (setup.sh installs VirtualGL + KasmVNC, so a display path exists.)
3. **Persistent Blender vs one-shot scripts** for the build loop — test the `bpy` 5.2.2 wheel (Python 3.13, published 2026-09-15) against the Lab add-on's background server; the `_for_cli` tools likely do not keep state between calls.
4. **Codex specifics to verify on the installed version:** per-path permission profiles, `--profile` file layout, hook trust in non-interactive `exec`, MCP tool approvals in `exec` (auto-cancel bug reported in v0.130), image input and structured output on the Agents API path.
5. **Calibrate the gates:** no published study measures, per asset, how well silhouette IoU or a VLM judge tracks human ratings of code-generated Blender models. Build a golden set of 10–20 assets with human ratings and tune thresholds on it.
6. **Model split:** which family generates and which judges. Thin evidence — Gemini 3.1 Pro led difference-spotting (89.6% VDiff-Bench); GPT-5.5 led human-voted code-to-3D, then Gemini 3.1 Pro. Keep them different families either way.

---

## 10. Sources

**Papers (LLM/VLM → 3D code)**
3D-GPT https://arxiv.org/abs/2310.12945 · SceneCraft https://arxiv.org/abs/2403.01248 · BlenderAlchemy https://arxiv.org/abs/2404.17672 · BlenderGym https://arxiv.org/abs/2504.01786 · BlenderLLM https://arxiv.org/abs/2412.14203 · LL3M https://arxiv.org/abs/2508.08228 · MeshCoder https://arxiv.org/abs/2508.14879 · VLMaterial https://arxiv.org/abs/2501.18623 · Query2CAD https://arxiv.org/abs/2406.00144 · CADCodeVerify https://arxiv.org/abs/2410.05340 · CAD-Assistant https://arxiv.org/abs/2412.13810 · CAD-Coder https://arxiv.org/abs/2505.14646 , https://arxiv.org/abs/2505.19713 · Img2CAD https://arxiv.org/abs/2408.01437 · IR3D-Bench https://arxiv.org/abs/2506.23329 · ShapeCraft https://arxiv.org/abs/2510.17603 · VIGA https://arxiv.org/abs/2601.11109 · Articraft https://arxiv.org/abs/2605.15187 · 3DCodeBench https://arxiv.org/abs/2606.01057 · SEIG https://arxiv.org/abs/2606.02580 · 3D-CoS https://arxiv.org/abs/2606.10478 · P3D-Bench https://arxiv.org/abs/2606.11152 · Nova3D https://arxiv.org/abs/2607.22738 · 3DHarnessBench https://arxiv.org/abs/2609.06535

**Papers (VLM perception, verification, judging)**
Spatial/perspective gaps https://arxiv.org/abs/2508.13142 , https://arxiv.org/abs/2505.23764 , https://arxiv.org/abs/2602.15892 · counting priors https://arxiv.org/abs/2505.23941 · small objects https://arxiv.org/abs/2502.17422 · CoT hurts spatial https://arxiv.org/abs/2604.16060 · calibration https://arxiv.org/abs/2505.20236 · Set-of-Mark https://arxiv.org/abs/2310.11441 · grid overlay https://arxiv.org/abs/2605.08220 · zoom/DeepEyes https://arxiv.org/abs/2505.14362 · reference-object scale https://arxiv.org/abs/2412.07825 · 3DSRBench FlipEval https://arxiv.org/abs/2409.09788 · judge self-preference https://arxiv.org/abs/2604.11589 · pairwise judging https://proceedings.mlr.press/v235/chen24h.html · DSG https://arxiv.org/abs/2310.18235 · GPTEval3D https://arxiv.org/abs/2401.04092 · verifier scaling https://arxiv.org/abs/2504.01786 · DreamSim https://arxiv.org/abs/2306.09344 · image-to-3D metric correlation https://arxiv.org/abs/2503.21745 · VDiff-Bench https://arxiv.org/abs/2609.06245 · constrained programs over 3D memory https://arxiv.org/abs/2606.00963 · detector-based verification https://arxiv.org/abs/2310.11513

**Perception tools**
SAM 3 https://ai.meta.com/sam3/ · SAM 3D Objects https://github.com/facebookresearch/sam-3d-objects , https://arxiv.org/abs/2511.16624 · MoGe-2 https://arxiv.org/abs/2507.02546 · Depth Anything 3 https://arxiv.org/abs/2511.10647 · VGGT https://github.com/facebookresearch/vggt · Orient Anything V2 https://arxiv.org/abs/2601.05573 · fSpy https://fspy.io/basics/ · Gemini image understanding https://ai.google.dev/gemini-api/docs/image-understanding · Claude vision https://platform.claude.com/docs/en/build-with-claude/vision · Agentic Vision https://blog.google/innovation-and-ai/technology/developers-tools/agentic-vision-gemini-3-flash/

**Blender**
Lab MCP https://www.blender.org/lab/mcp-server/ , https://projects.blender.org/lab/blender_mcp · blender-mcp https://github.com/ahujasid/blender-mcp · blender-ai-mcp https://github.com/PatrykIti/blender-ai-mcp · CLI args & render https://projects.blender.org/blender/blender-manual/raw/branch/main/manual/advanced/command_line/arguments.rst · operator gotchas https://projects.blender.org/blender/blender/raw/branch/main/doc/python_api/rst/info_gotchas_operators.rst · Python API release notes 4.0/4.1/4.2/5.0/5.1/5.2 under https://projects.blender.org/blender/blender-developer-docs/raw/branch/main/docs/release_notes/ · 5.0 pipeline I/O https://projects.blender.org/blender/blender-developer-docs/raw/branch/main/docs/release_notes/5.0/pipeline_io.md · FBX exporter source https://projects.blender.org/blender/blender/src/branch/main/scripts/addons_core/io_scene_fbx/__init__.py · glTF exporter docs https://projects.blender.org/blender/blender-manual/src/branch/main/manual/addons/scene_gltf2.rst · bpy wheel https://pypi.org/project/bpy/ · fake-bpy-module https://pypi.org/project/fake-bpy-module/ · 3D Print Toolbox https://projects.blender.org/extensions/print3d_toolbox

**Unity**
FBX importer https://docs.unity3d.com/6000.0/Documentation/Manual/FBXImporter-Model.html · LOD import https://docs.unity3d.com/6000.0/Documentation/Manual/importing-lod-meshes.html · glTFast https://docs.unity3d.com/Packages/com.unity.cloud.gltfast@6.17/manual/index.html , /features.html · lightmap UVs https://docs.unity3d.com/6000.3/Documentation/Manual/LightingGiUvs-GeneratingLightmappingUVs.html · mesh colliders https://docs.unity3d.com/6000.4/Documentation/Manual/prepare-mesh-for-mesh-collider.html · HDRP mask map https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.3/manual/Mask-Map-and-Detail-Map.html · URP LitInput.hlsl https://github.com/Unity-Technologies/Graphics/blob/master/Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl · URP FBX material preprocessor https://github.com/Unity-Technologies/Graphics/blob/master/Packages/com.unity.render-pipelines.universal/Editor/AssetPostProcessors/FBXMaterialDescriptionPreprocessor.cs · AssetPostprocessor https://docs.unity3d.com/6000.0/Documentation/ScriptReference/AssetPostprocessor.OnPreprocessModel.html · texture import https://docs.unity3d.com/6000.3/Documentation/Manual/texture-type-default.html · Humanoid https://docs.unity3d.com/Manual/UsingHumanoidChars.html · submission guidelines https://assetstore.unity.com/publishing/submission-guidelines · Asset Store Tools https://github.com/Unity-Technologies/com.unity.asset-store-tools

**Validators**
glTF-Validator https://github.com/KhronosGroup/glTF-Validator · fbx-sanitizer https://github.com/Pontoco/fbx-sanitizer · MeshLint https://github.com/rking/meshlint · Blender_Asset_Validator https://github.com/HugoMontanes/Blender_Asset_Validator

**Codex / harness**
non-interactive mode https://learn.chatgpt.com/docs/non-interactive-mode · CLI reference https://learn.chatgpt.com/docs/developer-commands?surface=cli · config reference https://learn.chatgpt.com/docs/config-file/config-reference · sandboxing https://learn.chatgpt.com/docs/sandboxing · hooks https://learn.chatgpt.com/docs/hooks · AGENTS.md https://learn.chatgpt.com/docs/agent-configuration/agents-md · skills https://learn.chatgpt.com/docs/build-skills · SDK https://learn.chatgpt.com/docs/codex-sdk · MCP server removal https://learn.chatgpt.com/docs/mcp-server · Agents API https://developers.openai.com/api/docs/guides/agents-api/overview · Codex prompting guide https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide · reasoning https://developers.openai.com/api/docs/guides/reasoning · harness engineering https://openai.com/index/harness-engineering/ · Anthropic: long-running harnesses https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents , harness design https://www.anthropic.com/engineering/harness-design-long-running-apps , writing tools https://www.anthropic.com/engineering/writing-tools-for-agents , building effective agents https://www.anthropic.com/engineering/building-effective-agents , context engineering https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents · known issues: MCP outside sandbox https://github.com/openai/codex/issues/7635 , MCP approvals in exec https://github.com/openai/codex/issues/24135 , output-schema bug https://github.com/openai/codex/issues/15451

**Existing Blender agent skills (prior art)**
https://github.com/0x0bug/blender-lowpoly-assets · https://github.com/brianchenanimator/blendsmith · https://github.com/lovecatisgood-sudo/3d-asset-generation-blender-unity-game-development-skills · https://github.com/RobLe3/cc-blender-skill · https://github.com/ra100/blender-claude-plugin

**Generative 3D**
TRELLIS.2 https://github.com/microsoft/TRELLIS.2 (nvdiffrast license https://github.com/NVlabs/nvdiffrast/blob/main/LICENSE.txt) · Hunyuan3D 2.1 https://huggingface.co/tencent/Hunyuan3D-2.1 · TripoSG https://github.com/VAST-AI-Research/TripoSG · SF3D https://github.com/Stability-AI/stable-fast-3d · Rodin API https://wavespeed.ai/docs/docs-api/hyper3d/hyper3d-rodin-v2-image-to-3d · Meshy API https://docs.meshy.ai/en/api/image-to-3d

**Secondary / unverified sources** (treated as weaker evidence): MindStudio Blender-MCP field report https://www.mindstudio.ai/blog/claude-blender-mcp-real-world-performance · polygon budgets https://low-poly.com/blog/polygon-budgets-by-platform-2026 · Quest performance https://developers.meta.com/horizon/documentation/unity/unity-perf/ · texel density https://www.beyondextent.com/deep-dives/deepdive-texeldensity · Unity FBX import notes https://uninomicon.com/fbx_importing · Codex permission profiles https://codex.danielvaughan.com/2026/04/20/codex-cli-split-permissions-fine-grained-filesystem-network-policies/ · Tri-Bench summary https://en.papernotes.org/AAAI2026/vlm_reasoning/tri-bench_stress-testing_vlm_reliability_on_spatial_reasoning_under_camera_tilt_/
