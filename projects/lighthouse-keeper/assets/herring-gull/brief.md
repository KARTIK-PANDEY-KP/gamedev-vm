# Production brief — Herring Gull

**Project:** CANDLEWICK LIGHT — a North Atlantic light station on the night of 21 October 1904. Pre-electric: no wiring, no bulbs, no plastics, no aluminium, no stainless steel.
**Pipeline:** Blender 5.2.2 → FBX → Unity 6. 1 Blender unit = 1.00 metre.
**Slice status:** **NOT** in the first playable slice. This asset must not block slice delivery.

> **Read this before you model — one contradiction in the source set.**
> The asset manifest's one-line note for this entry says "1.10 m wingspan" and says the gull is "never named in the asset table". Both are stale. The design set names this asset twice, consistently, at **0.62 m length × 1.44 m wingspan** — `art-bible.md` §8 asset table **row 56**, and `game-design.md` §4 entity roster. **Build to 0.62 m × 1.44 m.** See Assumption **A1** and Open question **Q1**.

---

## Identity

| Field | Value |
|---|---|
| Asset id | `herring-gull` |
| Engine asset name | `CHR_HerringGull_01` |
| Texture set name | `T_HerringGull_01_A` / `_N` / `_ORM` |
| Class | **character** — skinned mesh with an armature (`art-bible.md` §8 row 56, Class column) |
| Tier | **background** — ambient dressing, no gameplay function |
| Variant count | **1.** One mesh, one material, one texture set, three looped animation clips. No colour variants, no juvenile plumage, no second bird, no LOD chain. |
| Instances in the world | **1** (`game-design.md` §4: "1 instance") |
| In the first slice | **No** (`art-bible.md` §8 row 56, In-slice column: "No"; `vision.md` deferred-content list names "Herring Gull") |

### What it is for

It is the only living thing in Candlewick Light other than the player, and it has **no gameplay effect whatsoever** (`game-design.md` §4 entity roster, Key stats column). It is not interactable, not a collectable, not a hint, not a hazard, and nothing in this game can be harmed (`vision.md` pillar 3, "Pressure Without Violence").

Its entire job is to make the Gallery read as a real place in real weather rather than a set piece. One adult herring gull has come in off the water and is sitting out the leading edge of the gale in the lee of an iron rail, 25.2 m above the sea. It is present at **Storm Stage ≤ 2 only** (`level-design.md` §3.11) — wind 14 m/s at Stage 1, 19 m/s at Stage 2 (`game-design.md` §3.4 Storm System table). The storm advances one Stage per fault repaired and never recedes, so the bird is gone for good once Stage 3 arrives at 24 m/s. The player meets it early, loses it, and the Gallery is emptier for the rest of the Night. That is the whole design intent.

It **flees when the player closes to 3.0 m** (`game-design.md` §4).

### Where it belongs

- **The Gallery**, +25.20 m, exterior — the game's only exterior area. A 1.15 m-wide iron grating ring around the lantern, 16.96 m circumference, 10.7 m² walkable, with a 1.05 m rail (`level-design.md` §2 Metrics; §3.11). The gull **perches on the Gallery Rail** (`game-design.md` §4; `level-design.md` §3.11 Landmarks) and **shelters on the deck in the rail's lee** (asset-manifest note: "one scripted sheltering appearance under the Gallery rail"). Build both poses — see Open question **Q6**.
- **Exterior, gliding** — seen at range off the tower in exterior views (`art-bible.md` §8 row 56, Used-in column: "Gallery Rail, exterior").

It appears in no interior area. It has an audio emitter — its call sits at **1.8–3.4 kHz** (`level-design.md` §3.11 audio reference) — but the sound is not your deliverable; you supply the socket on the head bone.

---

## Art direction

### Silhouette intent and shape language

**This asset is the one deliberate exception to the project's shape language, and you must know that going in.** `art-bible.md` §4 forbids organic curves and mandates cylinders, rings, radial spokes, flanges, rivet lines, I-sections and 2–8 mm chamfers on every edge. Every one of those rules exists to describe *manufactured objects*, and **none of them applies to the bird**. Do not chamfer the gull. Do not make it radially symmetric. Do not put a machined edge, a rivet, a flange or a fillet anywhere on it. A builder who applies §4 literally here produces a tin bird, and the whole point of the asset is that it is the one thing on the Gallery that was not made in a foundry.

What *does* carry over from §4 is the project's symmetry contract — machined things are symmetric, keeper-made things are asymmetric. The gull is neither, and resolves as: **bilaterally symmetric in form, asymmetric in wear.** Model the body symmetric; break it only in the texture and in the single notched primary called out under Wear.

Three silhouettes, in the order the player sees them:

1. **Perched (primary read).** A closed horizontal wedge. Seen from the side against `#2E4650` Iron Blue sky at 5–10 m it must read as one unbroken mass: a flat top line from crown to tail tip, a heavy convex belly, the bill a short blunt spike at the front, the tail a clean taper at the back, the legs almost invisible under the body. Wings fully folded and tucked **inside** the body outline — nothing breaks the silhouette except the **crossed black primaries projecting 0.05 m past the tail tip**. That crossed-primary notch is the single silhouette feature that says "gull" at distance. Protect it; do not smooth it into the tail.
2. **Sheltering.** The same wedge, compressed. Head drawn back into the shoulders, crown dropping from 0.38 m to 0.26 m, the neck gone entirely, the whole shape reading as a rounded stone with a bill on it. This is the pose the player sees most and the pose the storm justifies.
3. **Gliding.** A shallow, flat **M** — straight leading edge, 5° dihedral, a long narrow hand with the outer primaries splayed into four visible slots. Stiff, locked and riding the gale. **Not** a curved seagull-icon crescent.

**The silhouette rule this asset must deliberately fail.** `art-bible.md` §4 requires every *interactable* to be identifiable as a black mask at 4.0 m. The gull is not interactable, and this game's visual grammar is absolute: **brass, and only brass, means the player can operate it** (`art-bible.md` §3, Brass row). The gull's bill is Brass-coloured by palette necessity. Keep it short (0.055 m) and non-metallic so it never reads as a brass fitting on a rail already surrounded by brass fittings. **Test:** render the asset as a black mask against `#8C8578` at 4.0 m — it must read as *a bird*, never as a fixture.

### Colour keys

Twelve colours exist in this game. Nothing is painted, lit or textured outside the set; tints between two swatches are permitted, new hues are not (`art-bible.md` §3). A real herring gull is white-headed with a yellow bill, pink legs and a red bill spot — **three of those four are illegal here.** The mapping below is the resolution and is not open to reinterpretation.

| Zone | Hex | Palette name | Note |
|---|---|---|---|
| Head, neck, throat, breast, belly, flanks, undertail, tail, trailing wing edge, primary mirrors | `#A8B4B0` | Sea Foam | The gull's "white". Sea Foam is the palette's only high-value cool and is already the game's wave-crest and salt-bloom colour, so the bird reads as made of the same sea as the surf 25.2 m below. |
| Mantle, scapulars, upper wing coverts | `#5C6B6A` | Weathered Zinc | The same swatch as the Gallery Rail it sits on. Intentional — the bird half-disappears into the rail until it moves. |
| Primary wingtips (outer 0.14 m), primary shafts, claws | `#0B1418` | Deep Storm Black | The darkest value in the game; the only true black on this asset. |
| Bill | `#C2A15A` | Brass | **Colour only — metallic 0.00.** See the material table and the trap named below it. |
| Gonys spot on the lower mandible (0.008 m) and the orbital eye ring | `#6E2E24` | Oxide Red | The game's only world-legal red. |
| Legs, tarsi, webbed feet | `#836B5F` | *permitted tint* | A 70/30 blend of `#8C8578` Lime Render and `#6E2E24` Oxide Red. §3 allows tints between two swatches; this is the legal stand-in for the real bird's pink. Assumption **A11**. |
| Iris | `#8C8578` | Lime Render | Pale, cold, blank. |
| Pupil | `#0B1418` | Deep Storm Black | |
| Salt crust, crown and upper mantle | `#A8B4B0` | Sea Foam | Applied as a patchy mask over the base, not as a base. See Wear. |

**Forbidden on this asset, without exception:**

- `#FFF6E2` **Optic White.** The single brightest value in the game, reserved for *emitted light only* — the flame core, the Fresnel Optic hotspot and the *Ardmore*'s masthead light (`art-bible.md` §3; §7 "Don't use Lamp Gold or Optic White as a base colour"). This is the most likely mistake on this asset, because real herring gulls are white. A white bird on the rail puts a second near-white object into the exact frame the player is scanning for the beam, on the one surface in the game whose purpose is watching that beam go out over the water.
- `#F2C879` **Lamp Gold.** Emitted light only. The bill is Brass, not Lamp Gold.
- `#D94F2B` **Warning Vermilion.** UI only, capped at 1 % of screen area, never on any world object ever (`art-bible.md` §3; §7). The gonys spot is Oxide Red.

**Value and saturation discipline** (`art-bible.md` §3): saturation stays **below 40 %** across the whole asset — no exception, because the only exceptions in the game are the flame and the UI. The gull lives in the frame's 30 % band (`#5C6B6A`–`#8C8578`) with its darks in the 60 % band. It must never enter the 10 % band that belongs to Brass, Lamp Gold and Optic White.

### Material callouts by zone

`art-bible.md` §5 declares four material families "and no fifth" — Wet Granite, Painted Iron, Brass, Tarred Oak — plus one shared transmissive glass. **All five are inorganic, and this asset fits none of them**, exactly as the other character-class asset `CHR_Keeper_Hands` fits none of them. A fifth, character-only family is therefore declared openly here rather than smuggled in by mislabelling feathers as Tarred Oak. See Assumption **A3**.

| Zone | Material | Base colour | Roughness | Metallic |
|---|---|---|---|---|
| Breast, belly, flanks (soft down) | Character / Feather | `#A8B4B0` | 0.62 dry | 0.00 |
| Mantle, scapulars, folded wing coverts (hard tract feathers) | Character / Feather | `#5C6B6A` | 0.38 dry lower back → **0.22** rain-wet shoulders | 0.00 |
| Primaries and tail (stiff vaned feathers) | Character / Feather | `#0B1418` tips, `#A8B4B0` bases | 0.30 | 0.00 |
| Bill | Character / Keratin | `#C2A15A` | 0.26 on the culmen ridge and hook, 0.40 at the base | **0.00** |
| Legs, tarsi, webbed feet | Character / Keratin | `#836B5F` | 0.34 scaled tarsus, 0.52 web | 0.00 |
| Eye (cornea + iris) | Character / Keratin | `#8C8578` + `#0B1418` | 0.06 | 0.00 |

**The trap, named.** The bill is `#C2A15A`, and in `art-bible.md` §5 Brass means metallic 1.00 at roughness 0.12–0.55 with tarnish in the cavity AO and a polished rub-through on the hand-contact patch. **Apply none of that to the bill.** Keratin is a dielectric. A metallic bill will catch the Lamp Key's 2 200 K rim on every 7.5 s sweep and flash like a fitting — which in this game means "operate me". **Metallic is 0.00 across 100 % of this asset's texel area.**

**Never uniform.** `art-bible.md` §7: "Don't use uniform roughness across any surface." The mantle alone must run 0.22 → 0.38 across its own area, wet shoulders to dry lower back.

### Wear, age and story state

An adult bird that lives on a rock in the North Atlantic and has just come off the water into the front edge of a gale. Four states. Three live in the texture; one is geometry.

1. **Salt bloom** — crown, nape and upper mantle, `#A8B4B0` Sea Foam at 30–55 % opacity, broken and patchy, heaviest on the crown. Masked to faces with an **up-vector above 0.60**, per the project-wide rule (`art-bible.md` §7: "Bake salt bloom only to faces with an up-vector above 0.60").
2. **Rain-wet shoulders and back** — roughness down to 0.22 across the upper mantle and the folded wing, with the feather tracts reading as separated wet spikes in the normal map rather than as a smooth coat. The belly stays dry and lofted at 0.62. The wet/dry boundary is the story: the bird got its back soaked and then tucked its front out of the weather.
3. **One notched primary** — the third primary on the **left** wing broken short by 0.035 m. This one is **geometry**, because it sits on the silhouette, and it is the asset's single asymmetry of form. It is the bird's history in one detail.
4. **Paraffin film** — a faint desaturated grey smear on the lower breast, 15 % opacity, no hue shift, `#5C6B6A` drifting toward `#8C8578`, from sitting against a rail that has had forty years of oil-handling hands on it.

No blood, no wound, no missing eye, no dead bird. Nothing in this game can be harmed, and an injured gull reads as a threat cue in a game with none (`vision.md` pillar 3).

### What to take from the project's look

Take the **weather**, the **palette discipline** and the **material honesty**. Realism **7 / 10** (`art-bible.md` §1): physically plausible materials, correct real-world dimensions, light and colour pushed one stop past documentary. Not photoreal — **no subsurface scattering, no micro-detail below 1 mm, no photogrammetry**. Not stylised — no outlines, no hand-painted texture, no exaggerated proportion, no flat shading.

Feathers read as **tracts and groups** in the normal map — mantle, scapulars, greater and median coverts, primaries, rectrices — never as ten thousand individual barbs.

Every reference image for this asset is generated with the project's LOCKED STYLE PROMPT **verbatim**, reproduced here in full so this brief stands alone (`art-bible.md` §2):

> *Rendered as a physically-based 3D game asset at a realism level of seven out of ten, in the material language of a 1904 North Atlantic lighthouse: dressed grey granite, riveted wrought iron, galvanised steel, polished and tarnished brass, thick lead-painted timber, tarred oak and hand-blown crown glass. Shape language is heavy, symmetrical and load-bearing — cylinders, rings, radial spokes, flanges, rivet lines and simple chamfers between 2 mm and 8 mm, with no sharp unsupported edges, no organic curves and no decorative flourish beyond a single engraved brass plate. Surfaces are worn by salt and forty years of hands: paint chipped to bare metal on every corner and handle, verdigris and oil-black in every recess, salt bloom on horizontal faces, and a polished rub-through wherever a keeper actually touches the object; roughness varies from 0.12 on rubbed brass to 0.92 on wet granite and never sits uniform across a surface. Palette is cold slate, iron blue and weathered zinc broken by a single warm accent of brass and lamp gold, with oxide red reserved for painted ironwork; total colour count is low and saturation stays under forty percent except in the flame. Lighting is a single warm point source at 2200 kelvin rim-lighting the object from one side against a cold 6500 kelvin storm fill from the other, wet specular highlights, deep unlit shadow with no fill-flash, and no coloured gels, no neon, no lens flare, no bloom past the lamp itself. Neutral grey backdrop, three-quarter view, no ground shadow on the backdrop, no text, no logos, no watermark, no human figures.*

For this asset the style clause governs **palette, lighting, realism level and wear language only**. Its material list (granite, iron, brass, oak, glass) and its shape clause ("no organic curves") describe the world the gull sits in, not the gull; the subject description overrides both for the bird's own form and surface.

### What would be wrong — named, with the reason

- **An Optic White gull.** The failure mode above. `#FFF6E2` exists in this game so the player's eye finds the flame across 8 000 m. A near-white bird on the Gallery rail competes with the one thing the Gallery is for.
- **A metallic bill.** Brass colour plus metallic 1.00 equals "interactable" in this game's grammar. Metallic 0.00, everywhere.
- **Spread, heraldic wings in the perch pose.** The perched read is a closed wedge. A wings-out gull is ornament, and `art-bible.md` §7 forbids ornament and nautical trim outright. This bird is hunkered, not posing.
- **A flock.** One instance (`game-design.md` §4), and `art-bible.md` §9 caps **skinned meshes on screen at exactly 2 — `CHR_Keeper_Hands` and this asset.** A second gull breaks a hard budget line, not a preference.
- **Chamfers, rivets, radial symmetry or any machined read.** §4's shape language is for manufactured objects. See the opening of this section.
- **Alpha-card feathers.** No cutout planes, no alpha-tested feather sheets, no fur shells. One closed opaque shell; all fine detail lives in the normal map. See Topology rules.

---

## Geometry

### Real-world dimensions, in metres

| Dimension | Value | Source |
|---|---|---|
| Body length, bill tip to tail tip | **0.620 m** | `art-bible.md` §8 asset table, row 56, Real-dimension column; `game-design.md` §4 entity roster |
| Wingspan, tip to tip, wings spread | **1.440 m** | `art-bible.md` §8 asset table, row 56, Real-dimension column; `game-design.md` §4 entity roster |
| Standing height, feet to crown, head up | 0.380 m | Assumption **A4** |
| Standing height, feet to crown, head tucked (shelter pose) | 0.260 m | Assumption **A4** |
| Body width, wings folded | 0.170 m | Assumption **A4** |
| Body depth, belly to back | 0.200 m | Assumption **A4** |
| Wing chord, shoulder → tip | 0.220 m → 0.050 m | Assumption **A4** |
| Crossed primaries projecting past the tail tip | 0.050 m | Assumption **A4** |
| Bill, length × depth at base | 0.055 m × 0.018 m | Assumption **A4** |
| Tarsus length / foot length including web | 0.065 m / 0.060 m | Assumption **A4** |
| Tail length from vent | 0.160 m | Assumption **A4** |
| Web thickness (solid, not a plane) | 0.004 m | Assumption **A4** |

0.62 m × 1.44 m is a real, internally consistent adult *Larus argentatus*, so the secondary dimensions above are true species proportions at that size and need no distortion to fit.

### Triangle budget and LODs

| Line | Value | Source |
|---|---|---|
| LOD0 triangles | **3 400** | budget table: `art-bible.md` §8 asset table, row 56 Herring Gull, Tri-budget column |
| **LOD count** | **1 — LOD0 only** | budget table: `art-bible.md` §9, "LODs per asset above 4 000 tris — 3, at screen heights 100 % / 35 % / 12 %". 3 400 < 4 000, so no LOD chain is required, and none may be added. Row 56 lists no LOD chain, unlike row 55 *Ardmore*, which lists three explicitly. |
| Bone count | **9**, against a hard cap of 24 | `art-bible.md` §8 row 56 Description column ("9 bones"); cap from budget table: `art-bible.md` §9, "Bone count per skinned mesh — 24" |
| Animation clips | **3 looped**, against a whole-game budget of 62 | `art-bible.md` §8 row 56 Description column ("3 looped animations"); budget table: `art-bible.md` §9, "Animation clips, whole game — 62" |
| Skinned meshes on screen | this asset is **1 of 2** permitted | budget table: `art-bible.md` §9, "Skinned meshes on screen — 2 (Keeper's Hands, Herring Gull)" |
| Draw calls | **1** (one material, one submesh), against a frame cap of 900 | budget table: `art-bible.md` §9, "Draw calls per frame — 900" |
| Unique material instances | this asset is **1 of 140** | budget table: `art-bible.md` §9, "Unique material instances — 140" |
| Unique texture sets | this asset is **1 of 46** | budget table: `art-bible.md` §9, "Unique texture sets — 46" |
| Platform target | PC 2560 × 1440 / 60 fps; Steam Deck 1280 × 800 / 60 fps | budget table: `art-bible.md` §9, Targets |

**Suggested internal split of the 3 400.** The total is from the budget table; the split is **Assumption A5** and a builder may redistribute freely as long as the total holds.

| Region | Tris |
|---|---|
| Body, neck and head shell | 1 250 |
| Wings, 540 each | 1 080 |
| Tail | 280 |
| Legs and feet, 230 each | 460 |
| Bill | 210 |
| Eyes, 60 each | 120 |
| **Total** | **3 400** |

Spend the wing budget at the **hand and the outer primaries**, not at the shoulder. Four readable primary slots at the tip are what carry the glide silhouette; the shoulder is hidden by the body in the pose the player sees most.

### Pivot and origin rule

- **Origin** sits at the **foot-contact plane between the two feet**, on the body's bilateral centre plane — the point the bird stands on. In Blender's Z-up authoring space: X = 0 on the bilateral plane, Y = 0 at the midpoint between the two feet along the length axis, Z = 0 at the sole of the foot.
- **Root bone** `root` sits at that origin with an **identity transform**.
- **Object transform at export** reads location (0, 0, 0), rotation (0, 0, 0), scale (1, 1, 1) on both the mesh and the armature.
- **Facing.** Author the gull facing **−Y in Blender** (Z-up authoring), i.e. the bill points toward the viewer in Front Orthographic view. With the FBX export axes specified under Integration (−Z Forward, Y Up), Blender −Y maps to **Unity +Z**, so the bird arrives facing Unity forward with Y up. Do not author facing +Y; the bird will arrive back-to-front.
- **Bind / rest pose:** wings **spread flat and horizontal at 0° dihedral**, legs tucked straight under the body, body level, head forward and neck extended. This is not a shipping pose. It exists so the skin weights are clean and so the 1.440 m wingspan and 0.620 m length are directly measurable off the rest-pose bounding box for the ±2 % import check (`art-bible.md` §9, "Import scale check").

### Grid and snap

**Not modular. No grid snap applies.** The project grid module is 0.30 m and all *prop* placement snaps to it (`level-design.md` §2 Metrics, "Grid module — 0.30 m | all prop placement snaps to this"), but this is a character-class asset positioned by a scripted spawn transform on the Gallery Rail and by a spline for the glide pass. It belongs to no kit and shares no modular sheet.

### Collision

- **No physics collider on the mesh.** The gull has no gameplay effect (`game-design.md` §4) and must never obstruct a 1.15 m walkway where the player is already limited to Brace speed 1.40 m/s (`level-design.md` §3.11).
- **One trigger-only sphere, radius 3.00 m**, centred on `root`, for the flee check (`game-design.md` §4: "flees at 3.0 m"). `isTrigger` on, no collision response.
- That trigger sits on a layer **excluded from the interaction sphere cast** — a 0.10 m-radius sphere cast along camera-forward at 2.20 m range (`game-design.md` §3.8) — so the gull can never become an interaction target and never shows a prompt.
- **Excluded from the navmesh.** No obstacle, no carve.

### Topology rules

- **Quad cage while modelling, triangulated on export.** The exported mesh is **100 % triangles with zero n-gons** (`art-bible.md` §5 pipeline line: "meshes triangulated … no n-gons").
- **Custom split normals authored and exported** (`art-bible.md` §5 pipeline line: "custom normals exported"). Hard edges only at the bill-to-face junction, the eyelid ring and the leg-to-belly junction. Everything else smooth.
- **One closed, watertight, manifold shell.** No interior faces, no self-intersections, no floating parts. The two eyes are the only separate closed shells and they are welded into the socket rim, not floated inside it.
- **No alpha-tested geometry anywhere.** No feather cards, no cutout sheets, no fur shells, no double-sided faces. Opaque render queue; the albedo carries no alpha channel. At 3 400 tris a card-based bird is not buildable, and the overdraw would land on the one surface where rain particles are already capped at 14 000 on screen (`art-bible.md` §9).
- **Deformation loops:** minimum **3 edge loops** at every deforming joint — neck base, neck-to-head, each shoulder, each wrist, tail base. Keep poles off the shoulder and off the neck. The wing needs one clean spanwise loop at the wrist so the 5° dihedral in the Glide clip does not crease.
- **Feather geometry only where it hits the silhouette:** the crossed primaries past the tail, the four splayed primary slots at the wing tip, the notched third left primary, and the outer edge of the tail. Everything else is normal-map.
- **Legs and feet modelled closed**, with the web as a **0.004 m solid**, never a single plane.
- **No non-uniform scale** anywhere in the hierarchy (`art-bible.md` §5 pipeline line).
- **No vertex colours** (`art-bible.md` §5: "no vertex-colour-driven shading except on Sea Surface").

### Rig

**9 bones exactly** (`art-bible.md` §8 row 56), named as below:

| # | Bone | Parent | Deform | Note |
|---|---|---|---|---|
| 1 | `root` | — | no | At the origin. Drives whole-body translation and yaw for the glide path. |
| 2 | `body` | `root` | yes | Pelvis through chest. Legs and feet are rigid-weighted 100 % to this bone. |
| 3 | `neck` | `body` | yes | |
| 4 | `head` | `neck` | yes | The 1.8–3.4 kHz call emitter socket parents here (`level-design.md` §3.11 audio reference). |
| 5 | `wing_L_01` | `body` | yes | Humerus + forearm as one segment. |
| 6 | `wing_L_02` | `wing_L_01` | yes | Hand and primaries. |
| 7 | `wing_R_01` | `body` | yes | |
| 8 | `wing_R_02` | `wing_R_01` | yes | |
| 9 | `tail` | `body` | yes | |

- Maximum **4 bone influences per vertex**, weights normalised to 1.000, zero unweighted vertices.
- Nine bones leaves nothing for the legs (Assumption **A6**). That imposes a rig constraint you must respect: **in both perch clips the feet stay planted and the `body` bone moves no more than 0.004 m vertically**, with any sway expressed as a roll about the foot-contact line. Real perched-bird idles are head, neck and tail motion anyway, so this costs nothing — but a builder who animates a 0.03 m body bob will float the feet off the rail. See Open question **Q5**.

### Animation

**Three looped clips** (`art-bible.md` §8 row 56: "3 looped animations"). Lengths, frame rate and content are **Assumption A7**.

| Clip | Length | Content |
|---|---|---|
| `CHR_HerringGull_01@Perch_Idle` | 4.0 s, 30 fps, 120 frames | Head-up perch. Two head turns at ±35° yaw, one neck ruffle at 2.2 s, one tail flick, body roll ≤ 1.5°. Seamless loop. |
| `CHR_HerringGull_01@Perch_Shelter` | 6.0 s, 30 fps, 180 frames | Hunkered in the rail's lee. Crown at 0.26 m, neck retracted, body yaw ≤ 2° against gusts, a 1.4 Hz mantle ruffle. The clip the player sees most. Seamless loop. |
| `CHR_HerringGull_01@Glide` | 3.0 s, 30 fps, 90 frames | 5° dihedral, wings locked, wingtip primaries flexing ±0.05 m at 0.33 Hz, head locked on the horizon, legs tucked, tail fanned 18°. Seamless loop. |

All three ship with Loop Time and Loop Pose enabled. **There is no takeoff clip** — the budget is three. The 3.0 m flee is a 0.25 s cross-fade from either perch clip into `Glide` with `root` translating away along a spline. Flagged as Open question **Q3**.

**Placement note for whoever integrates this.** Wind is onshore from **242°**, and the Gallery Door faces 242° straight into it (`level-design.md` §1; §3.11). Perch the gull on the **lee** arc of the ring, roughly bearing 062°, facing into the wind at 242° — which is what a real bird does, and what makes the mantle ruffle blow the right way. Assumption **A12**; integration-side, not a mesh constraint.

---

## Texture and material

| Line | Value | Source |
|---|---|---|
| Texture resolution, every map | **1024 × 1024** | budget table: `art-bible.md` §8 asset table, row 56 Herring Gull, Texture column ("1024") |
| Albedo | **BC7, sRGB** | `art-bible.md` §5, "Maps and formats" |
| Normal | **BC5**, two-channel, tangent-space, **+Y up** | `art-bible.md` §5, "Maps and formats" |
| ORM | **BC7, linear** — **AO in R, Roughness in G, Metallic in B** | `art-bible.md` §5, "Maps and formats" |
| Emissive | **None.** BC6H emissive exists only on Fresnel Optic, Lamp Burner, Keeper's Lantern and the *Ardmore* | `art-bible.md` §5, "Maps and formats" |
| Height map | **None** | `art-bible.md` §5: "No height maps" |
| Detail normal / second UV | **None** | `art-bible.md` §5: "no detail-normal second UV" |
| Vertex colour | **None** | `art-bible.md` §5: "no vertex-colour-driven shading except on Sea Surface" |
| Unique-texture size ceiling | 2048 × 2048 (this asset sits well under) | `art-bible.md` §7: "Don't let any unique texture exceed 2048 × 2048 except the two 4096 modular sheets and the Storm Sky Dome" |
| **Texel density** | **1 024 px/m, tolerance ±10 % → 922–1 126 px/m** | **Assumption A2** — derived, not quoted. Reasoning below. |

**Why 1 024 px/m, and why it is not one of the three published bands.** `art-bible.md` §5 gives three densities — **512 px/m** for hero interior assets the player's face comes within 0.60 m of, **256 px/m** for modular architecture and set dressing, **128 px/m** for Rock Base, Skerry Shoal and Sea Surface — and rejects anything more than 15 % off its band. **None of the three bands has an entry for a character-class skinned asset**, and both character rows in §8 are budgeted well above their nearest band (`CHR_Keeper_Hands` carries a 2048 map on roughly 0.20 m² of surface). Applying the 256 px/m set-dressing band here would use about 6 % of the 1024 × 1024 sheet that row 56 mandates and waste the rest.

So the density is derived from the mandated sheet instead. This model unwraps to approximately **0.68 m² of shell area** (≈ 0.22 m² body, ≈ 0.36 m² for both wings at both faces, ≈ 0.10 m² head, neck, tail, bill, legs). At 1 024 px/m that packs into the 1024 × 1024 sheet at roughly **70 % utilisation** — a normal, healthy pack with room for padding. 1 024 px/m also has a one-line field check: **a 1.00 m × 1.00 m patch of unwrapped surface exactly fills the sheet.** If the art lead rules that §5's 512 px/m hero band governs character assets, drop to a 512 × 512 sheet rather than ship a three-quarters-empty 1024 — see Open question **Q4**.

### UV rules

- **One UV set only, UV0. No UV1.** There is no lightmap channel on this asset: `art-bible.md` §9 puts lightmaps on architecture only ("Lightmap resolution — 12 px/m on architecture, no lightmaps on props"), and a skinned mesh cannot be lightmapped in any case. Lighting comes from light probes.
- **All shells inside 0.0–1.0** in both U and V, with no shell touching the 0.0 or 1.0 border.
- **No overlapping shells, no mirrored shells, no stacked shells.** The two wings get unique UV space. Mirroring would halve the texture cost and would also mirror the salt crust, the wet patches and the notched primary — which are the asset's entire asymmetry, and are visible on a 0.62 m object at 3.0 m.
- **Padding:** 8 px between shells at 1024, 16 px from the sheet border (Assumption **A8**).
- **Seam placement:** ventral midline, back of the neck, underside of each wing at the trailing edge, inside of each leg, and the vent. **No seam crosses the crown, the mantle or the bill ridge.**
- **Straighten the shells** for the primaries and the tail feathers so the feather-vane normal detail runs along UV space and reads cleanly.
- **Texel density uniform across all shells** within the ±10 % tolerance. No hero-ing the head at the wings' expense.

### Trim sheet or atlas

**None. This asset ships its own unique 1024 texture set.** `art-bible.md` §5 assigns the one 4096 × 4096 trim sheet and the one 4096 × 4096 granite atlas to **modular architecture only** — "Modular architecture shares one 4096 × 4096 trim sheet plus one 4096 × 4096 granite atlas; no modular piece gets a unique texture." Row 56 classes this asset as `character`, not `modular`, with "1024" in its own Texture column. It consumes **1 of the 46 unique texture sets** in the `art-bible.md` §9 budget and **1 of the 140 unique material instances**.

---

## Context

### Scale anchor

**Measure against the player.** The player character, Principal Keeper Iona Rekk, is a **1.80 m tall capsule, 0.60 m in diameter, with the camera at 1.68 m eye height** (`game-design.md` §4 entity roster; `level-design.md` §2 Metrics, "Player capsule").

Perched on the Gallery Rail, the gull's crown sits at about **1.43 m** — 1.05 m of rail plus 0.38 m of bird — which is **0.25 m below the player's eye line.** The player looks slightly *down* at it. If your gull's head comes up level with or above 1.68 m while it is standing on a 1.05 m rail, it is too big, and that number tells you by how much.

Two everyday anchors, in case a real object is easier to judge than a capsule:

- **A dinner plate is about 0.27 m across.** The perched gull is 0.62 m long and 0.17 m wide — a little over two plates end to end, and well under one plate across.
- **A standard house brick is 0.215 m long.** The gull's bill is 0.055 m, about a quarter of a brick. Its tarsus is 0.065 m. If your bill is approaching brick length, it is nearly four times too long.

### Neighbouring assets it must sit beside

Everything below is a real asset in this game that stands within a few metres of the gull on the Gallery (+25.20 m, exterior). Model against these, not against a reference photo.

| Neighbour | Size | Why it matters here |
|---|---|---|
| **Gallery Rail** | 1.80 m arc × **1.05 m tall**, 3 bars, 12 segments, `#5C6B6A` Weathered Zinc, 1 900 tris (`art-bible.md` §8 row 15; `level-design.md` §2) | The perch. The feet must wrap the top bar — bar section is Open question **Q2**. |
| **Gallery Deck Segment** | 1.80 m arc × **1.15 m deep**, iron grating on cantilever brackets, 12 segments, ring 16.96 m, 10.7 m² walkable (`art-bible.md` §8 row 14; `level-design.md` §2, §3.11) | The shelter spot, in the rail's lee. |
| **Galvanised Bucket** | **0.30 m tall × 0.28 m Ø** (`art-bible.md` §8 row 52, listed for Workshop and Gallery) | **The single best side-by-side check available.** The perched gull at 0.38 m is 0.08 m *taller* than this bucket. |
| **Gallery Door** | 0.70 m × 1.80 m × 0.06 m with a **0.22 m Gallery Storm Sill**, on bearing 242° (`art-bible.md` §8 row 8; `level-design.md` §2) | The 0.22 m sill is a good small-scale check: a little more than half the gull's standing height. |
| **Board Clamp** | 0.22 m × 0.09 m (`art-bible.md` §8 row 41) | Roughly four times the length of the gull's bill. |
| **Coil of Rope** | 0.46 m Ø × 0.16 m tall (`art-bible.md` §8 row 53, listed for Store Room and Gallery) | Sits on the deck beside the shelter pose. |
| **Storm Pane** | 1.10 m × 1.45 m × 0.012 m, 8 off (`art-bible.md` §8 row 11) | The lantern glazing seen from outside, immediately behind the bird. |
| **Lantern Frame Segment** | 1.45 m tall × 1.10 m chord, 8 off (`art-bible.md` §8 row 10) | |
| **Storm Board** | 1.20 m × 1.55 m × 0.040 m, 14 kg (`art-bible.md` §8 row 40) | Keeper-made oak board, fitted over a broken pane out here. |
| **Wind Vane** | 1.10 m tall × **0.72 m span** (`art-bible.md` §8 row 13, at the roof apex) | The gull's 1.44 m wingspan is exactly **twice** this vane's span. |
| **Roof Dome** | 5.40 m Ø × 1.70 m rise, seamed copper (`art-bible.md` §8 row 12) | Above the lantern. |
| **Skerry Shoal** | 210 m × 90 m, 3.2 m above datum, at 1 480 m on bearing 128° (`art-bible.md` §8 row 58) | What the gull is silhouetted against on a lightning flash. |
| ***Ardmore*** | 58.0 m LOA × 9.2 m beam × 4.4 m draught, at 8 000 m (`art-bible.md` §8 row 55) | The masthead light the player is scanning for — the thing this asset must never compete with. |

---

## Integration

### Authoring in Blender 5.2.2

1. **Units.** Scene Properties → Units → Unit System **Metric**, Unit Scale **1.0**, Length **Metres**, Separate Units off. **1 Blender unit = 1.00 metre** (`art-bible.md` §5 pipeline line). Model at real-world size in metres from the Geometry table *before* UVs are laid out (`art-bible.md` §7, "Do").
2. **Orientation.** Author **Z-up**. The gull faces **−Y** (bill toward the viewer in Front Ortho, Numpad 1).
3. **Origin.** Object origin at the foot-contact point between the feet, on the bilateral centre plane. The `root` bone sits there with an identity transform.
4. **Apply transforms before export.** Object → Apply → **All Transforms** on both the mesh and the armature, so each reads location (0, 0, 0), rotation (0, 0, 0), scale (1, 1, 1). Do this before binding, or re-apply and re-bind. No non-uniform scale anywhere in the hierarchy (`art-bible.md` §5 pipeline line).
5. **Triangulate**, and author and export **custom split normals** (`art-bible.md` §5 pipeline line).

### FBX export from Blender 5.2.2

| Setting | Value |
|---|---|
| Path Mode | Copy; Embed Textures **off** |
| Limit to | Selected Objects — mesh + armature only |
| Object Types | Armature, Mesh |
| **Scale** | **1.00** |
| **Apply Scalings** | **FBX Unit Scale** |
| **Forward** | **−Z Forward** |
| **Up** | **Y Up** |
| Apply Unit | on |
| Apply Transform | off — Bake Axis Conversion handles the conversion on the Unity side |
| Geometry → Smoothing | **Normals Only** (this is what exports the custom split normals) |
| Geometry → Apply Modifiers | on |
| Geometry → Triangulate Faces | on |
| Geometry → Tangent Space | on |
| Armature → Add Leaf Bones | **off** |
| Armature → Only Deform Bones | on |
| Armature → Primary / Secondary Bone Axis | Y / X (Blender default) |
| Bake Animation | **off** on the mesh FBX, **on** for each clip FBX |
| NLA Strips / All Actions | off — one action per clip file |

**Four files, using Unity's `@` animation convention:**

```
CHR_HerringGull_01.fbx                  mesh + armature, bind pose, no animation
CHR_HerringGull_01@Perch_Idle.fbx       armature + one action
CHR_HerringGull_01@Perch_Shelter.fbx    armature + one action
CHR_HerringGull_01@Glide.fbx            armature + one action
```

### Unity 6 import settings

**Model tab**

| Setting | Value |
|---|---|
| Scale Factor | **1** |
| Convert Units | on |
| **Bake Axis Conversion** | **on** |
| Import BlendShapes | off |
| Import Visibility / Cameras / Lights | off |
| Mesh Compression | Off |
| Read/Write Enabled | off |
| Optimize Mesh | on |
| Generate Colliders | **off** |
| Normals | **Import** (custom normals are authored) |
| Blend Shape Normals | None |
| Normals Mode | Unweighted Legacy |
| Tangents | **Calculate Mikktspace** |
| Swap UVs | off |
| Generate Lightmap UVs | **off** — no lightmap channel on this asset |

**Rig tab**

| Setting | Value |
|---|---|
| Animation Type | **Generic** |
| Avatar Definition | Create From This Model on `CHR_HerringGull_01.fbx`; the three clip files use **Copy From Other Avatar** pointing at it |
| Root node | `root` |
| Skin Weights | Standard, **Max Bones/Vertex 4** |
| Optimize Game Objects | on, no exposed transforms |

**Animation tab** — on each clip file

| Setting | Value |
|---|---|
| Import Animation | on |
| Loop Time / Loop Pose | **on / on** |
| Root Transform Rotation / Position Y / Position XZ | Bake Into Pose on all three, original-based |
| Resample Curves | on |
| Anim. Compression | Optimal |
| Rotation / Position / Scale Error | 0.5 / 0.5 / 0.5 |

**Materials tab:** Material Creation Mode **None**. Assign the project material by hand; do not let the importer author one.

**Texture import**

| Map | Type | sRGB | Compression | Max Size |
|---|---|---|---|---|
| `T_HerringGull_01_A` | Default | **on** | BC7, High Quality | 1024 |
| `T_HerringGull_01_N` | **Normal map** | n/a | BC5 | 1024 |
| `T_HerringGull_01_ORM` | Default | **off** (linear) | BC7, High Quality | 1024 |

Generate Mip Maps on, Streaming Mip Maps on, Filter Mode Trilinear, Aniso 2.

**Prefab renderer settings:** Skinned Mesh Renderer; Cast Shadows **On**; Receive Shadows **On**; Light Probes **Blend Probes**; Reflection Probes **Blend Probes**; Skinned Motion Vectors on; Update When Offscreen **off**; Quality Auto. Cull beyond **80 m** (Assumption **A9**). One `SphereCollider`, radius 3.00 m, `isTrigger` on, on the non-interactable layer.

### Delivery folders

- **In this repository:** source `.blend` → `assets/herring-gull/source/`; **exported FBX files and textures → `assets/herring-gull/model/`**; reference images → `assets/herring-gull/refs/`.
- **In the Unity project:** **`Assets/Art/Characters/CHR_HerringGull/`**, with `Textures/` and `Animations/` subfolders, and the prefab `CHR_HerringGull_01.prefab` at the folder root.

Folder paths and the `CHR_`/`T_` naming are **Assumption A10** — the design set states no folder convention.

> **Format note.** `art-bible.md` §5's pipeline header reads "Blender 5.2.2 → glTF 2.0 → Unity 6", while this brief specifies FBX. FBX is what the four-file `@`-clip convention and the Generic-avatar rig workflow above depend on. If the art lead rules glTF: export `.glb`, Y-up with +Z forward built in (no axis conversion needed, so **Bake Axis Conversion does not apply**), unit scale 1.0, `KHR_materials_unlit` off, and ship the three clips as named animations inside the single `.glb`. Everything else in this brief — dimensions, budgets, maps, packing — is format-independent. Raised as Open question **Q10**.

---

## Reference images

The images in `refs/` are **style and silhouette reference only.**

They are **generated images, not orthographic drawings.** They are not turnarounds, not blueprints, not to scale, and not internally consistent with one another. Their perspective is arbitrary, their proportions drift from image to image, and any dimension you believe you can measure off them is wrong.

**Use them for:** plumage tract layout, the colour relationship between mantle and breast, the salt and wet-feather wear language, the read of the folded-wing silhouette, and the general feel of this bird in this project's light.

**Do not use them for:** any length, any width, any angle, any ratio, any feather count, or the bill-to-head proportion.

**Every measurement on this asset comes from the Geometry section above.** Where a reference image and the Geometry section disagree, the Geometry section wins — without exception and without asking.

---

## Assumptions

Values chosen here that the design set did not state.

| # | Assumption | Why | What it affects |
|---|---|---|---|
| **A1** | **Wingspan 1.44 m, body length 0.62 m** — not the 1.10 m wingspan in the asset-manifest note. | The design set states 0.62 × 1.44 twice and consistently: `art-bible.md` §8 row 56 and `game-design.md` §4. The manifest note is a single stale line that also claims the gull is "never named in the asset table" when it is row 56 of that table. Two concurring design documents beat one self-contradicting note. | Every dimension in the Geometry table, the ±2 % bounding-box check, the texel-density derivation, every scale-anchor comparison. Escalated as **Q1**. |
| **A2** | **Texel density 1 024 px/m, ±10 %.** | `art-bible.md` §5's three bands (512 / 256 / 128 px/m) have no entry for a character-class skinned asset, and the nearest band would leave the mandated 1024 × 1024 sheet about 6 % used. 1 024 px/m fills it to ≈ 70 % across ≈ 0.68 m² of shell area. | The UV layout, the sheet size, acceptance criterion 17. Escalated as **Q4**. |
| **A3** | **A fifth material family — "Character" (feather and keratin), dielectric, metallic 0.00** — is used on this asset. | `art-bible.md` §5 declares four families and "no fifth", but all four are inorganic and neither character asset in §8 can be built from them. Declaring the exception is better than mislabelling feathers as Tarred Oak. | The material table, ORM authoring, acceptance criterion 22. |
| **A4** | **All secondary dimensions**: 0.38 m standing height (0.26 m hunkered), 0.17 m body width, 0.20 m body depth, 0.22 → 0.05 m wing chord, 0.055 × 0.018 m bill, 0.065 m tarsus, 0.060 m foot, 0.16 m tail, 0.05 m primary projection, 0.004 m web. | The design set gives only length and wingspan. These are true adult *Larus argentatus* proportions at a 0.62 m / 1.44 m size, which keeps the asset inside the project's 7/10 realism rating. | Both poses, the perch height on a 1.05 m rail, the Galvanised Bucket scale check. |
| **A5** | **Triangle split across regions** — 1 250 body / 1 080 wings / 280 tail / 460 legs / 210 bill / 120 eyes. | The 3 400 total is from the budget table; the split is stated nowhere. This one keeps enough density at the wing tips for the four primary slots that carry the glide silhouette. | Where the budget goes. Redistribute freely provided the total holds. |
| **A6** | **No leg bones; legs and feet rigid-weighted 100 % to `body`.** | `art-bible.md` §8 row 56 fixes the count at 9 bones, and nine covers root, body, neck, head, four wing segments and tail with nothing left over. | Forces the ≤ 0.004 m vertical `body` constraint in both perch clips so the feet do not float. Escalated as **Q5**. |
| **A7** | **Clip lengths and contents** — Perch_Idle 4.0 s, Perch_Shelter 6.0 s, Glide 3.0 s, all 30 fps. | The design set says "3 looped animations" and nothing more. These lengths loop without reading as a loop at the distances the gull is seen from. | The animation deliverables and their 3-of-62 slot in the whole-game clip budget. |
| **A8** | **UV padding — 8 px between shells at 1024, 16 px from the border.** | Not stated. 8 px survives BC7 block compression and mip level 3 without bleeding between shells. | The UV layout, acceptance criterion 21. |
| **A9** | **Cull distance 80 m; shadows cast and received.** | Not stated. The gull exists only on a 16.96 m ring and on short glide passes near the tower, so 80 m covers both with margin. Shadow casting is on because the Lamp Key sweeps the Gallery every 7.5 s, and a shadowless bird on lit grating reads as a decal. | Prefab renderer settings only. |
| **A10** | **Naming and folders** — `CHR_HerringGull_01`, textures `T_HerringGull_01_{A,N,ORM}`, Unity path `Assets/Art/Characters/CHR_HerringGull/`, repo path `assets/herring-gull/model/`. | `design/` states no naming or folder convention. The `CHR_` prefix follows the existing asset manifest (`CHR_Keeper_Hands`), the `_01` suffix follows the project's asset-naming pattern. | Where the files land. Nothing about the mesh. |
| **A11** | **Leg and foot colour `#836B5F`** — a 70/30 blend of `#8C8578` Lime Render and `#6E2E24` Oxide Red. | The real bird's legs are pink; there is no pink in the twelve-colour palette. `art-bible.md` §3 permits tints between two swatches but forbids new hues. Stated as an exact hex so four builders do not mix four different pinks. | The albedo, acceptance criterion 27. |
| **A12** | **The gull perches on the lee arc, roughly bearing 062°, facing into the 242° wind.** | Not stated; it is what a real bird does, and it makes the mantle ruffle blow correctly against the wind direction fixed in `level-design.md` §1. | Placement and ruffle direction. Integration-side, not a mesh constraint. |
| **A13** | **The 3.0 m flee radius is implemented as a trigger-only sphere on the gull**, on a layer excluded from the interaction cast. | `game-design.md` §4 states the 3.0 m flee distance but names no collider. Excluding the layer is required so the gull never becomes an interaction target under the 2.20 m sphere cast in `game-design.md` §3.8. | The prefab, acceptance criterion 32. |

---

## Open questions

Questions, not guesses. Each has an answer that changes the deliverable; the build proceeds on the Assumptions above until they are answered.

- **Q1.** The asset-manifest note says **1.10 m wingspan**; `art-bible.md` §8 row 56 and `game-design.md` §4 both say **1.44 m**. This brief builds to 1.44 m. **Which is canon, and should the manifest note be corrected?** A 1.10 m bird is 76 % of a 1.44 m bird in every linear dimension and fails the ±2 % bounding-box check outright — this is not a detail that can be fixed at import.
- **Q2.** **What is the section and diameter of the Gallery Rail's top bar?** `art-bible.md` §8 row 15 gives the rail as 1.80 m arc × 1.05 m tall with 3 bars in Weathered Zinc, but no bar profile. The feet and their webs are modelled gripping that specific member in the perch pose. Until this is answered they are built for a **0.034 m round bar**, matching the 32 mm stock of the Feed Line Run (`art-bible.md` §8 row 29). A flat bar or a different diameter means re-modelling the grip.
- **Q3.** The clip budget is exactly **three looped** animations, which leaves no takeoff. **Is the 3.0 m flee meant to be a 0.25 s cross-fade straight into the glide loop, or is a fourth one-shot `Takeoff` clip authorised** against the 62-clip whole-game budget (`art-bible.md` §9)? A cross-fade will read as the bird teleporting into flight if the player happens to be looking at it when it goes — and at 3.0 m on a 1.15 m walkway, they usually will be.
- **Q4.** `art-bible.md` §5's texel-density bands (512 / 256 / 128 px/m) have **no entry for character-class assets**, and §5 rejects anything more than 15 % off its band. **Which band governs `CHR_HerringGull_01` and `CHR_Keeper_Hands` — or is a fourth character band being added?** If the ruling is 512 px/m, this asset should ship a 512 × 512 sheet rather than a three-quarters-empty 1024.
- **Q5.** `art-bible.md` §8 row 56 fixes the rig at **9 bones**, which leaves nothing for the legs. **May the rig go to 11 bones — one per tarsus — to allow a real grip and a step?** The §9 cap is 24 bones per skinned mesh, so 11 is well inside budget; it is the 9 in row 56 that is in question.
- **Q6.** The manifest note describes "one scripted sheltering appearance **under** the Gallery rail"; `level-design.md` §3.11 and `game-design.md` §4 both place the gull **on** the rail. This brief builds both — a perch on the top bar and a shelter pose hunkered on the grating deck in the rail's lee. **Is the scripted beat one appearance or two, and does it play on the rail, on the deck, or first one and then the other?**
- **Q7.** `art-bible.md` §9 caps **skinned meshes on screen at 2**, and `CHR_Keeper_Hands` is on screen in every frame of a first-person game. That leaves exactly one slot for the gull. **Is that one slot also expected to cover a distant gliding gull while the perched one is present?** If a glide pass and a perch can ever coexist on screen, the budget line is violated with a single instance and the exterior glide needs a different solution.
- **Q8.** `level-design.md` §3.11 gives the gull's call at 1.8–3.4 kHz, but `audio.md` puts gulls at 14.0 s inside `sfx_ship_abeam` (§4.5) and `sfx_ui_win` (§4.8) — both of which fire at the *end* of the Night, long after Storm Stage 3 has despawned this asset. **Are the Passing Abeam and Win-card gulls this mesh, off-screen gulls with no mesh at all, or a separate dawn spawn?** If this asset has to be visible at dawn it needs a Storm-Stage-independent spawn rule and probably a fourth clip.
- **Q9.** **Is the gull ever meant to be visible from inside** — through the Watch Room's Window Splay, or from the Lamp Room through a Storm Pane? This changes the cull distance and decides whether the perch pose has to read through 1.2 mm crown glass with a 2 % green tint (`art-bible.md` §5, glass).
- **Q10.** `art-bible.md` §5's pipeline header says **glTF 2.0**; the delivery spec for this asset says **FBX**. **Which is the shipping format for character assets?** The rig and clip-file conventions in Integration differ between them; everything else is unaffected.

---

## Acceptance criteria

Every line below is a pass/fail check a tool, a script or the importer can make. No line is a judgement call.

**Geometry**

1. `CHR_HerringGull_01.fbx` LOD0 triangle count is **≤ 3 400** (`art-bible.md` §8 row 56) and **≥ 2 900**.
2. The file contains exactly **one** mesh LOD: no LODGroup component, no `_LOD1` or `_LOD2` meshes.
3. Exported mesh is **100 % triangles**: n-gon count = 0, quad count = 0.
4. Inverted / flipped face-normal count = **0**.
5. The shell is manifold and watertight: non-manifold edge count = 0, interior-face count = 0, boundary-edge count = 0 outside the two eye-socket rims.
6. Mesh and armature object transforms at export both read location (0.000, 0.000, 0.000), rotation (0.000°, 0.000°, 0.000°), scale (1.000, 1.000, 1.000).
7. Mesh origin lies within **0.005 m** of the foot-contact plane between the two feet, on the bilateral centre plane; the `root` bone transform is identity at that origin.
8. Rest-pose bounding box measures **1.440 m ±2 %** (1.411–1.469 m) on the wingspan axis and **0.620 m ±2 %** (0.608–0.632 m) on the length axis, per the `art-bible.md` §9 import-scale check.
9. Custom split normals are present in the exported FBX.
10. Vertex colour channel count = **0**.
11. No alpha-tested, cutout or double-sided geometry; the material's render queue is Opaque and the albedo has no alpha channel.

**Rig and animation**

12. Bone count = **9**, named exactly `root`, `body`, `neck`, `head`, `wing_L_01`, `wing_L_02`, `wing_R_01`, `wing_R_02`, `tail` — and ≤ 24 (`art-bible.md` §9).
13. Maximum bone influences per vertex = **4**; every vertex's weights sum to 1.000 ±0.001; unweighted vertex count = 0.
14. Exactly **3** animation clips ship, each with Loop Time and Loop Pose enabled.
15. First and last frame of each clip match within 0.001 m and 0.01° on every bone.
16. In `Perch_Idle` and `Perch_Shelter`, maximum vertical displacement of the `body` bone across the clip is **≤ 0.004 m**.

**Texture and material**

17. Texel density measured on UV0 against the 1024 albedo is **1 024 px/m ±10 %** (922–1 126 px/m), and no shell deviates from the asset mean by more than that tolerance.
18. Three maps ship at exactly **1024 × 1024**: albedo BC7 sRGB, normal BC5, ORM BC7 linear. Emissive map count = 0; height map count = 0; detail-normal count = 0.
19. UV0 coordinates lie entirely within **0.0–1.0** in both U and V, with zero shells touching the 0.0 or 1.0 border.
20. Overlapping UV face count in UV0 = **0**; mirrored shell count = **0**; stacked shell count = **0**.
21. Inter-shell padding ≥ **8 px** at 1024; border padding ≥ **16 px**.
22. Exactly **one** UV set is exported. UV1 / lightmap channel is **absent**, and Generate Lightmap UVs is off on import.
23. ORM blue channel (Metallic) = **0** across 100 % of the texel area.
24. ORM green channel (Roughness) is not constant: standard deviation across the mantle shells > **0.03** (`art-bible.md` §7, "Don't use uniform roughness across any surface").
25. No albedo texel exceeds sRGB **(184, 184, 184)** in any channel — the `#A8B4B0` Sea Foam ceiling plus headroom. This is the machine check that `#FFF6E2` Optic White has not reached the plumage.
26. Every albedo texel has HSV saturation **≤ 0.40** (`art-bible.md` §3 value discipline).
27. No albedo texel falls within **ΔE 5** of `#D94F2B` Warning Vermilion (`art-bible.md` §7: never on any world object).
28. The albedo's colour clusters resolve to the nine hexes in the Colour keys table within **ΔE 8**; no tenth cluster exceeds 2 % of texel area.

**Engine**

29. `CHR_HerringGull_01.fbx` and the three clip FBXs import into **Unity 6 with 0 errors and 0 warnings** in the console.
30. Imported bounding box in Unity matches the authored real-world size **within 2 %** on all three axes (`art-bible.md` §9 import-scale check).
31. With Bake Axis Conversion on, the imported bird faces Unity **+Z** with **+Y** up, and the prefab transform reads position (0, 0, 0), rotation (0, 0, 0), scale (1, 1, 1).
32. The imported mesh renders in **1 draw call**, with 1 material and 1 submesh.
33. The prefab has **zero** physics colliders and exactly **one** `SphereCollider` of radius **3.00 m** centred on `root` with `isTrigger` = true, on a layer excluded from the interaction raycast layer mask.
34. Total on-disk texture footprint for this asset ≤ **3.0 MB** compressed (three BC-compressed 1024 maps with mips), counted against the `art-bible.md` §9 lines of 1.10 GB resident and 3.20 GB on disk.
35. The asset registers as exactly **1** unique texture set and **1** unique material instance, against the `art-bible.md` §9 caps of 46 and 140.
