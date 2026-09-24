Write the production brief for ONE asset, at `assets/{asset_id}/brief.md`.

THE ASSET:
- id: `{asset_id}`
- name: {asset_name}
- class: {asset_class}
- tier: {tier}
- in first slice: {in_slice}
- derived from: {derived_from}
- note: {note}

Read `design/` for everything this asset needs — the art bible for style, palette, materials and
its asset-table row; the level design doc for the areas it appears in, the metrics table and its
neighbours; the game design document if it is an entity with behaviour.

The brief must be SELF-CONTAINED. Whoever builds this asset sees this file and its reference
images and nothing else: not the design docs, not the other briefs. Anything you leave out, they
invent, and four builders invent four different answers.

Write these sections:

## Identity
Name, the engine asset name under a consistent naming convention (e.g. `SM_Chest_01`), class, tier,
variant count, what it is for in the game, and the areas or entities it belongs to.

## Art direction
Silhouette intent and shape language. Colour keys with hex values. Material callouts by zone —
which part is metal, cloth, painted wood, emissive. Wear, age and story state. What to take from
the project's look, and what to avoid: name at least one thing that would be wrong for this asset
and why.

## Geometry
Real-world dimensions in metres. Triangle budget per LOD, and the LOD count. Pivot and origin rule.
Grid and snap increment if it is modular. Collision type. Topology rules.
EVERY number here states the budget-table row it came from, like: `1,800 tris (budget table: mid
prop, PC)`. If a number is not in the table and not in the design docs, choose it and list it under
Assumptions instead of inventing a citation.

## Texture and material
Texel density with tolerance, texture resolution per map, the PBR channel set and packing
convention, UV rules, and which shared trim sheet or atlas it uses, each citing its source the
same way.

## Context
A scale anchor a builder can measure against — a real object, or the player character's height in
metres. The neighbouring assets this one must sit beside, by name, with their sizes.

## Integration
Export and import settings for Unity 6 from Blender 5.2.2: 1 unit = 1 metre, metric unit scale,
apply transforms before export, FBX scale 1.0 with FBX Unit Scale, -Z forward and Y up with Bake
Axis Conversion on import, and the folder the file is delivered into.

## Reference images
State plainly that the images in `refs/` are style and silhouette reference only, that they are
generated and not orthographic, and that every measurement comes from the Geometry section above.

## Assumptions
Every value you chose that the design set did not state: what you assumed, why, and what it affects.

## Open questions
Anything a builder would reasonably need to ask. Write the question, not a guess.

## Acceptance criteria
Only machine-checkable statements. Triangle count within budget, texel density within ±10%, UVs
inside 0–1 with no overlap on the lightmap channel, no inverted normals, no n-gons, pivot at the
stated origin, imports into Unity with no errors or warnings, real-world size within 2% of the
stated dimensions. Never "looks good".

Also write `assets/{asset_id}/subject.json` with exactly these keys, used to prompt the reference
images: `description` (one dense sentence describing the object's appearance for an image model:
form, materials, colours, wear, distinctive features — no camera or lighting words), `dimensions`
(the real-world size as a phrase, e.g. "0.9 m wide, 0.6 m tall"), and `negative` (one sentence of
what must not appear).

Write both files. Reply with one line confirming what you wrote.
