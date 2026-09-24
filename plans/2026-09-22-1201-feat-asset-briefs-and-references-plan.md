---
title: Asset Briefs and Reference Images - Plan
type: feat
date: 2026-09-22
topic: asset-briefs-and-references
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Asset Briefs and Reference Images - Plan

## Goal Capsule

- **Objective:** every asset a game needs arrives as its own package — one industry-form brief plus its reference images — complete enough that a builder who has never seen the rest of the game can make that asset and have it fit.
- **Product authority:** step two of the game-building harness: deriving the asset list, writing the per-asset packages, generating their reference images, and refining them in conversation. Building the assets is the step after.
- **Open blockers:** none.

---

## Product Contract

### Summary

Step two reads the approved design set from step one, derives the full list of assets the game needs, and — once the developer accepts that list — writes one self-contained brief per asset with reference images generated for each. The developer keeps refining briefs and images in conversation, and a change that contradicts the design docs is written back to them.

### Problem Frame

A design set describes a game. A builder needs one asset. Between them sits work nobody has done: the art bible names a dozen assets, the level doc implies thirty more as kit pieces and set dressing, and none of them carries the triangle budget, pivot rule, texel density, real dimensions or material callouts that making one actually requires.

Handing the whole design set to an asset builder does not solve it. The builder then re-reads the entire game to make a crate, and four builders working from the same prose invent four different answers to the same unstated question.

The industry has the opposite failure documented too. Assets get built from briefs "in a modular way, with little context for how they will be used", so a crate arrives at the wrong scale for the room it belongs in. The fixes are known: state the scale anchor, name the neighbouring assets, list the open questions, and make acceptance criteria measurable rather than subjective.

Reference images carry the other half. A brief can specify a silhouette in prose, but shape language, wear, colour and material read are what an image communicates in one glance — and an image-to-3D pipeline gets most of its accuracy from having four views instead of one.

### Key Decisions

- KD1. **Images carry look; the brief's numbers are authoritative** (session-settled: user-directed — chosen over treating images as the measurement source: prompting for an orthographic camera is a style token, not a projection, and generated views drift in proportion between angles). Governs R19.
- KD2. **The developer accepts the asset list before any brief or image is produced** (session-settled: user-approved — chosen over writing straight through: a wrong list multiplies into dozens of wrong briefs and paid image calls). Governs R3, R4.
- KD3. **Briefs cover 3D models, materials, VFX and UI** (session-settled: user-directed — only 3D and materials have a builder behind them today; the other two are written now so nothing is lost when a builder exists). Governs R1.
- KD4. **Each brief restates its own budgets and cites the table row they came from** (session-settled: user-approved — chosen over carrying tier and platform alone: the package stays self-contained while a wrong number stays traceable). Governs R7, R8, R29.
- KD5. **Chained generation from one locked project style key** (session-settled: user-approved — chosen over multi-view diffusion and Blender blockout conditioning: it needs no GPU work, keeps art quality highest, and the package contract stays open to swapping the method). Governs R20, R21.
- KD6. **A changed design doc marks affected briefs stale; nothing regenerates until asked** (session-settled: user-approved — chosen over automatic re-derivation: every regenerated image costs money, and most stale assets are not being built yet). Governs R26, R27.
- KD7. **A brief edit writes back to the design doc it came from** (session-settled: user-approved — chosen over letting the brief diverge or refusing the edit: the developer stays with the asset they are discussing, and the design set stays one truth). Governs R25.
- KD8. **Tier is the keystone field.** Hero, mid or background, together with the target platform, is what every published source derives triangle budget, texel density, texture resolution and LOD count from. Governs R2, R29.
- KD9. **The reference shape follows the asset class.** A turnaround is a 3D idea; a material needs a tile sample, VFX needs key stills, UI needs a mock. Governs R13.
- KD10. **OpenAI's GPT Image 2.5 generates the images** (session-settled: user-directed — the flare variant for the first view, the sunburst variant for every reference-conditioned view and later edit, since sunburst is the one built for editing precision). Governs R20, R21.

### Actors

- A1. **The developer** — accepts the asset list, reads packages, refines them in conversation.
- A2. **The step-two agent** — derives the list, writes the briefs, generates the images, applies refinements and write-backs.
- A3. **The asset builders** — the Blender agent for 3D, image generation for materials. Each reads one package and never the design set.

<!-- ce-section: work-relationships -->
### How This Work Fits Together

This plan owns step two: design set in, per-asset packages out. The surrounding steps are understood as follows, which is the current picture rather than a committed roadmap.

- Step one, the design doc set — see [the step-one plan](plans/2026-09-22-1107-feat-game-idea-to-handoff-docs-plan.md).
  - This work depends on it: the art bible, level doc and game design document are its inputs.
  - Shares the asset names defined there, and writes changes back into it.
- The Blender asset agent — see [the asset-agent research](plans/blender-asset-agent-research.md).
  - Depends on this work: one package is one job.
  - Still to decide: whether it also consumes the material packages or only 3D.
- Material, VFX and UI builders.
  - Depend on this work. Materials are producible today by image generation; VFX and UI have no builder yet.
- Engine assembly — placing built assets into a Unity scene.
  - Depends on both builders. Can proceed independently of this step's refinement loop.

### Requirements

**The asset manifest**

- R1. Step two derives the complete asset list from the design set: the art bible's asset table, the entity roster, and the areas in the level design doc, expanded into the modular kit pieces, set dressing, materials, VFX and UI elements those areas imply.
- R2. Every manifest entry carries the asset's name, its class (character, prop, kit piece, environment set, material, VFX, UI), its tier (hero, mid or background), whether it belongs to the first playable slice, and which design-doc sections it came from.
- R3. Step two presents the manifest and produces no brief and no image until the developer accepts it.
- R4. The developer can add, remove, re-tier or rename entries before accepting, and those edits are applied to the manifest before anything is produced.

**What a brief contains**

- R5. Each brief is self-contained: a builder can make the asset from the brief and its images alone, without reading the design set or another brief.
- R6. Identity: the asset's name, its engine asset name under the project naming convention, its class, its tier, its variant count, its gameplay function, and the areas or entities it belongs to.
- R7. Geometry: real-world dimensions in metres, the triangle budget per LOD, the LOD count, the pivot and origin rule, the grid and snap increment for modular pieces, the collision type, and topology rules. Every number states the budget-table row it came from.
- R8. Texture and material: texel density with tolerance, texture resolution per map, the PBR channel set and packing convention, UV rules, and which shared trim sheet or atlas the asset uses, each citing its table row.
- R9. Art direction: the silhouette intent, shape language, colour keys, material callouts by zone, wear and age state, and annotated references stating what to take from each — including negative references with the reason they are rejected.
- R10. Context: a scale anchor the builder can measure against, and the neighbouring assets this one must sit beside.
- R11. Integration: the export and import settings the asset must satisfy for the target engine, including units, axis conversion and the file layout it is delivered into.
- R12. Accountability: an assumptions list naming every value step two chose rather than read, an open-questions list, and acceptance criteria that are machine-checkable — never "looks good".

**Reference images**

- R13. The reference set follows the asset class: four views for anything modelled in 3D, a flat tile sample with its scale for a material, key stills for a VFX, and a screen mock for a UI element.
- R14. A 3D asset's four views are front, left, back and right, shot with one locked camera and identical framing, with the subject filling most of the frame and nothing cropped.
- R15. Characters and creatures are generated in a symmetric A-pose holding nothing. Anything a character carries is its own asset.
- R16. Images are at least 1024 pixels on the short side, on a transparent or flat white background, and ship with a per-view alpha mask.
- R17. Lighting is flat, even and identical across views, so shading is not mistaken for geometry or baked into a texture.
- R18. Every image ships with the prompt, the model and version, the seed, and the reference images it was conditioned on, so it can be regenerated.
- R19. Each package states that its images are not a metric source, and carries the numeric spec that is.

**Producing the packages**

- R20. Step two generates one project style key image before any asset, from the art bible's locked style prompt, and conditions every later image on it. The style key is generated with the fast GPT Image 2.5 variant.
- R21. For each 3D asset, step two generates the front view first, then generates the other three as reference-conditioned edits of the accepted front, using the editing-precision GPT Image 2.5 variant, so the views share one subject.
- R22. Before any run that spends image budget, step two states how many images it is about to generate and for which assets.
- R23. Packages are written into the game's repository, one folder per asset, beside the design set.

**Refining**

- R24. After a package exists, the developer refines it in conversation — the brief, the images, or both — and step two applies the change to that package.
- R25. A refinement that contradicts the design set is written back into the design doc it came from, and step two reports both edits.
- R26. Each brief records which design-doc sections it was derived from.
- R27. When a design-doc section changes, step two marks every brief derived from it stale, names them, and regenerates none of them until asked.
- R28. A refinement that reaches more than one asset states which assets and how many images it will regenerate before it runs.

**The budget table**

- R29. The project carries one budget table, seeded from published platform and tier figures and editable by the developer, that every brief's geometry and texture numbers are derived from and cite.

| Tier | Triangles (PC/console) | Texture | Texel density | LODs |
|---|---|---|---|---|
| Background prop | 200–800 | 512–1K | 1.28–2.56 px/cm | auto |
| Mid prop | 800–3,000 | 1K–2K | 2.56–5.12 px/cm | 2–3 |
| Hero prop | 8,000–25,000 | 2K–4K | 5.12–10.24 px/cm | 3–4 |
| Character (hero) | 30,000–80,000 | 2K–4K | 5.12–10.24 px/cm | 3–5 |
| Kit piece | sized to grid | shared trim sheet | matches set | 2 |

### Key Flows

- F1. Derive and accept the manifest
  - **Trigger:** the developer runs step two against an approved design set.
  - **Actors:** A1, A2
  - **Steps:** A2 reads the design set; derives every asset the game needs, including the ones only implied by level areas; tiers each; presents the manifest with its provenance.
  - **Outcome:** an accepted asset list. Nothing has been generated yet.
  - **Covered by:** R1, R2, R3, R4

- F2. Produce a package
  - **Trigger:** the manifest is accepted.
  - **Actors:** A2
  - **Steps:** A2 generates the project style key once; for each asset, writes the brief with its numbers drawn from the budget table, states what it is about to spend, then generates the front view and the remaining views conditioned on it; writes the package into the repository.
  - **Outcome:** one folder per asset holding a brief and its reference set.
  - **Covered by:** R5, R20, R21, R22, R23

- F3. Refine a package
  - **Trigger:** the developer asks for a change to a brief or an image.
  - **Actors:** A1, A2
  - **Steps:** A2 states the scope and image count if more than one asset is affected; applies the change; regenerates only the affected images; writes any contradicted design-doc section back upstream; reports both edits.
  - **Outcome:** a changed package and a design set that still matches it.
  - **Covered by:** R24, R25, R28

- F4. A design doc changes
  - **Trigger:** step one rewrites a section that briefs were derived from.
  - **Actors:** A2
  - **Steps:** A2 marks every brief derived from that section stale and names them.
  - **Outcome:** the developer knows what is out of date and chooses what to re-run.
  - **Covered by:** R26, R27

### Acceptance Examples

- AE1. Areas become kit pieces
  - **Covers R1, R2.**
  - **Given** the level doc describes a ruined village area with stone walls, timber roofs and a well,
  - **When** step two derives the manifest,
  - **Then** it lists the wall, roof and trim kit pieces and the well as separate entries, each tiered and traced back to that area, even though the art bible's asset table named none of them.

- AE2. A character package
  - **Covers R13, R14, R15, R19.**
  - **Given** a hero character who carries a lantern,
  - **When** step two produces the package,
  - **Then** the character's four views show an empty-handed A-pose, the lantern is its own manifest entry with its own package, and the character's brief states that its images are reference only while its height in metres is the metric authority.

- AE3. Refinement reaches back
  - **Covers R24, R25.**
  - **Given** a sword brief derived from the art bible's asset table,
  - **When** the developer says the blade should be a third longer,
  - **Then** the brief's dimensions and the asset table row both change, the affected images regenerate, and the report names both edits.

- AE4. A design change lands
  - **Covers R26, R27.**
  - **Given** thirty packages exist and the art bible's palette section changes,
  - **When** step two sees the change,
  - **Then** it names every brief derived from that section as stale and generates nothing until the developer asks.

- AE5. A refinement that spends
  - **Covers R22, R28.**
  - **Given** the developer asks for every prop to look more weathered,
  - **When** step two prepares the change,
  - **Then** it first states how many assets and images are affected, and waits.

- AE6. A material is not a turnaround
  - **Covers R13, R8.**
  - **Given** a tiling stone material,
  - **When** step two produces its package,
  - **Then** the reference is a flat tile sample with its real-world coverage stated, and the brief carries texel density, channel set and packing rather than a triangle budget.

### Success Criteria

- The Blender agent can build an asset from its package alone, without opening the design set or asking a question.
- After any refinement round, no brief contradicts the design set.
- Every number in a brief traces to a budget-table row or appears in that brief's assumptions list.
- A built asset sits correctly beside its named neighbours at the stated scale.

### Scope Boundaries

**Deferred for later**

- Building assets: modelling, texturing, material generation, VFX and UI production. Each consumes a package produced here.
- Placing built assets into a Unity scene.
- Any per-brief approval queue. The manifest is the only checkpoint; refinement is the loop after it.

**Outside this product's identity**

- Becoming a second design authority. When a brief and the design set disagree, the design set is corrected rather than bypassed.
- Claiming geometric authority for generated images. The brief holds the numbers, and the package says so.

### Dependencies / Assumptions

- An approved design set from step one exists; its asset table, entity roster, level areas and locked style prompt are this step's inputs.
- The build steps target Unity 6 with Blender 5.2.2, the toolchain this repository provisions, so integration fields are written for it.
- The harness has an OpenAI API key with access to GPT Image 2.5. Generation is hosted, so no local GPU is required, and image output is billed per token, which is what makes bulk regeneration a spending decision.
- Reference images are generated, not photographed or drawn, so they carry no licence encumbrance but also no real-world measurement.
- VFX and UI briefs are written against no existing builder, so their formats may change when one is built.

### Outstanding Questions

**Deferred to Planning**

- The per-run spending ceiling, and which quality tier each asset class is generated at.
- The folder and file naming for packages inside the repository, and how variants and LOD siblings are grouped.
- Whether the project style key is regenerated when the art bible's style prompt changes, or pinned for the life of the project.
- How a package is marked as built, so re-runs do not silently replace a brief an asset was already made from.
- Whether the Blender agent consumes material packages as well as 3D ones.

### Sources / Research

Two research passes fed this plan; both are summarized here rather than restated in the requirements.

- **How the industry briefs one asset.** Tier — hero, mid or background — is what every source derives budgets from, which is why it anchors the manifest and the budget table. Briefs written for builders without project context fail in a known way, and the mitigations adopted here are the industry's: a scale anchor, the neighbouring assets, an explicit open-questions field, and objective acceptance criteria, since "subjective criteria like 'looks good' should never appear as formal acceptance requirements". Published figures seeded the budget table: 200–800 / 800–3,000 / 8,000–25,000 triangles for background, mid and hero props; texel density of 1.28–2.56 px/cm top-down through 10.24 px/cm first-person; 512 texels per metre in The Last of Us Part II. Sources: [briefing a studio for UE5](https://nastyrodent.com/how-to-brief-a-game-art-studio-for-ue5-production/), [props pipeline](https://nastyrodent.com/3d-props-production-pipeline-for-aaa-games/), [texel density](https://www.beyondextent.com/deep-dives/deepdive-texeldensity), [modularity and uniqueness](https://www.beyondextent.com/articles/balancing-modularity-and-uniqueness-in-environment-art), [Allar's UE5 style guide](https://github.com/Allar/ue5-style-guide), [Unity FBX import](https://docs.unity3d.com/Manual/FBXImporter-Model.html), [Blender to Unity scale](https://www.katsbits.com/codex/unity-blender-fbx-scale/), [outsourcing practice](https://www.lemonskystudios.com/insights/game-art-outsourcing), [polygon budgets by platform](https://low-poly.com/blog/polygon-budgets-by-platform-2026), [Meta Horizon performance targets](https://developers.meta.com/horizon/documentation/unity/unity-perf/).
- **What reference images actually help.** Four views carry roughly three quarters of the accuracy gain over a single view, after which returns flatten. Generated "orthographic" views are not orthographic — a model whose assumed intrinsics differ from the input's produces perspective distortion, which is why the numbers live in the brief. Flat lighting, a prop-free A-pose, at least 1024 pixels, a clean background with alpha, and shipped generation metadata are the recipe the tooling documentation converges on. Sources: [Era3D](https://arxiv.org/pdf/2504.11734), [Flex3D](https://arxiv.org/html/2410.00890v1), [MVDream](https://alphaxiv.org/overview/2308.16512v4), [MV-Adapter](https://arxiv.org/abs/2412.03632), [Gemini image generation docs](https://ai.google.dev/gemini-api/docs/image-generation), [Meshy multi-view guidance](https://help.meshy.ai/en/articles/15723519-how-to-get-better-image-to-3d-results-in-meshy), [Scenario character turnarounds](https://help.scenario.com/articles/1419523552-generate-character-turnarounds), [A-pose versus T-pose](https://blog.neural4d.com/comparisons/a-pose-vs-t-pose), [baked lighting in generated textures](https://neural4d.com/how-tos/how-to-solve-baked-shadows-and-lighting-issues), [TRELLIS.2 model card](https://huggingface.co/microsoft/TRELLIS.2-4B).
