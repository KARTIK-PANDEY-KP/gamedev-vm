# CANDLEWICK LIGHT — Art Bible

Written to be executed. Every asset in the game is a row in §8. Names match `design/game-design.md` and `design/level-design.md` exactly.

Pipeline: Blender 5.2.2 → glTF 2.0 → Unity 6. 1 Blender unit = 1.00 m, Z-up authored, Y-up on export, meshes triangulated, custom normals exported, no n-gons, no non-uniform scale in the exported transform.

---

## 1. Realism rating and era

**Realism: 7 / 10.** Physically-plausible materials, correct real-world dimensions and true-to-life mechanical function, with light and colour pushed one stop past documentary — the flame reads warmer than tungsten, the storm reads bluer than it is, and contrast is held wider than a camera would record. Not photoreal (10): no skin detail, no subsurface, no micro-scratch layer below 1 mm, no photogrammetry. Not stylised (1–4): no outlines, no hand-painted texture, no exaggerated proportion, no flat shading.

**Era and genre of look:** North Atlantic light station, **1904**, late-Victorian civil engineering — dressed granite, riveted wrought iron, galvanised steel, polished brass, lead paint, tarred oak, hand-blown crown glass. Pre-electric throughout: no wiring, no switches, no bulbs, no plastics, no aluminium, no stainless steel, no fluorescents, no printed graphics beyond engraved brass and chalk.

---

## 2. LOCKED STYLE PROMPT

> Use this paragraph **verbatim** as the style clause of every asset image prompt in the project. Append only the asset's own name, description and dimensions. Do not paraphrase it, do not translate it, do not add or remove adjectives, and do not merge it with another style prompt.

**LOCKED STYLE PROMPT —**
*Rendered as a physically-based 3D game asset at a realism level of seven out of ten, in the material language of a 1904 North Atlantic lighthouse: dressed grey granite, riveted wrought iron, galvanised steel, polished and tarnished brass, thick lead-painted timber, tarred oak and hand-blown crown glass. Shape language is heavy, symmetrical and load-bearing — cylinders, rings, radial spokes, flanges, rivet lines and simple chamfers between 2 mm and 8 mm, with no sharp unsupported edges, no organic curves and no decorative flourish beyond a single engraved brass plate. Surfaces are worn by salt and forty years of hands: paint chipped to bare metal on every corner and handle, verdigris and oil-black in every recess, salt bloom on horizontal faces, and a polished rub-through wherever a keeper actually touches the object; roughness varies from 0.12 on rubbed brass to 0.92 on wet granite and never sits uniform across a surface. Palette is cold slate, iron blue and weathered zinc broken by a single warm accent of brass and lamp gold, with oxide red reserved for painted ironwork; total colour count is low and saturation stays under forty percent except in the flame. Lighting is a single warm point source at 2200 kelvin rim-lighting the object from one side against a cold 6500 kelvin storm fill from the other, wet specular highlights, deep unlit shadow with no fill-flash, and no coloured gels, no neon, no lens flare, no bloom past the lamp itself. Neutral grey backdrop, three-quarter view, no ground shadow on the backdrop, no text, no logos, no watermark, no human figures.*

---

## 3. Palette

Twelve colours. Nothing in the game is painted, lit or textured outside this set; tints between two swatches are permitted, new hues are not.

| Hex | Name | Where it is used | Why |
|---|---|---|---|
| `#0B1418` | Deep Storm Black | night sky base, sea in shadow, unlit interior floor, Pause scrim at 65 % | gives the beam something to be *against*; the darkest value in the game so the flame is always the brightest thing on screen |
| `#16262E` | Slate Sea | sea body, wet granite in shadow, Weight Shaft walls | reads as cold water and cold stone with one swatch, which keeps the tower feeling built out of the sea |
| `#2E4650` | Iron Blue | storm sky, rain, mid-tone ironwork, Lantern Frame Segment | the storm's signature hue; every exterior surface carries some of it so the weather looks like it is getting inside |
| `#5C6B6A` | Weathered Zinc | galvanised rails, Feed Line Run, pipe runs, Gallery Rail, Storm Board hardware | the neutral that separates ironwork from stone without adding a hue |
| `#8C8578` | Lime Render | interior plaster walls on every floor above the Oil Cellar | the only large warm-neutral field; makes interiors feel like a home rather than a machine |
| `#C2A15A` | Brass | Reservoir Cock, gauges, Watch Telescope, Lamp Burner body, Rotation Drive, all hand-touched fittings | the single accent that marks *what the player can operate*; brass and only brass means interactable |
| `#F2C879` | Lamp Gold | flame body, light pools, Keeper's Lantern glow, the beam | the reward colour; appears nowhere except emitted light |
| `#FFF6E2` | Optic White | flame core, Fresnel Optic hotspot, *Ardmore* masthead light | the only near-white in the game, so the eye goes to it across 8 000 m |
| `#6E2E24` | Oxide Red | painted floor plates, Interior Door, Oil Drum, Oil Sight Glass low float | 1904 lead-oxide primer; carries the "this is dangerous or important" reading diegetically, with no UI needed |
| `#3A2A1E` | Tarred Oak | Stair Flight treads, Stair Handrail, Watch Desk, Keeper's Bunk, Windsor Chair | the warmest dark; every surface the keeper's body touches is this colour, which draws the traversal path |
| `#A8B4B0` | Sea Foam | wave crests, rain streaks, salt bloom, Skerry Shoal surf | the only high-value cool; makes the shoal readable as a threat at 1 480 m |
| `#D94F2B` | Warning Vermilion | UI failure states and struck-through interaction prompts **only** | never appears in the world; its total on-screen area is capped at 1 % so it never competes with Lamp Gold |

**Value discipline.** 60 % of every frame sits between `#0B1418` and `#2E4650`. 30 % sits in `#5C6B6A`–`#8C8578`. 10 % or less is Brass, Lamp Gold and Optic White combined. Saturation stays below 40 % everywhere except flame and Warning Vermilion.

---

## 4. Shape language

- **Primitives:** cylinder, ring, disc, radial spoke, flange, rivet line, I-section. The whole tower is a stack of cylinders; the whole machine is a stack of rings on a vertical axis.
- **Symmetry:** everything machined is radially symmetric about a vertical axis or bilaterally symmetric. Everything hand-made (Storm Board, Rain Cape on Hook, Coil of Rope) is asymmetric. That contrast is the only way the player tells "made in a factory" from "made here by a keeper", and it maps onto "reliable" versus "improvised".
- **Chamfers:** 2–8 mm on all manufactured edges; no unsupported hard edge anywhere. Cast parts get a 4 mm fillet minimum.
- **Silhouette rule:** every interactable must be identifiable from its silhouette alone at 4.0 m in unlit conditions. Test by rendering the asset as a black mask against `#8C8578`.
- **Scale anchors:** every asset is authored against the 1.68 m eye height and the 0.30 m grid module. A 0.18 m brass handle, a 0.80 m door leaf and a 1.05 m rail are the three reference sizes to match against.
- **Forbidden forms:** organic curves, taper below 3° on structural members, exposed fasteners smaller than 4 mm, ornament, moulded plastic forms, anything that reads as machined after 1930.

## 5. Material and texture rules

Four material families, no fifth.

| Family | Base colour | Roughness | Metallic | Notes |
|---|---|---|---|---|
| **Wet Granite** | `#16262E` → `#5C6B6A` | 0.62 dry, 0.28 wet, 0.92 in sheltered dust | 0.00 | 3–8 mm tooling marks, salt bloom masked to horizontal faces above 0.60 up-vector |
| **Painted Iron** | `#6E2E24` or `#2E4650` | 0.48 on paint, 0.34 on rub-through | 0.00 paint / 1.00 exposed | chipping driven by a curvature mask, 100 % chip on every edge with radius < 5 mm |
| **Brass** | `#C2A15A` | 0.12 rubbed, 0.55 tarnished | 1.00 | tarnish in cavity-AO, rub-through on the exact contact patch a hand makes; every brass asset must show both |
| **Tarred Oak** | `#3A2A1E` | 0.40 waxed, 0.72 raw | 0.00 | grain runs along the member's long axis without exception |

Glass (Storm Pane, Fresnel Optic, Oil Sight Glass) is a single shared transmissive material: IOR 1.52, roughness 0.05 clean / 0.34 sooted, 2 % green tint toward `#16262E`, 1.2 mm thickness for panes and 18 mm for optic prisms.

**Texel density.** 512 px/m on hero interior assets the player's face gets within 0.60 m of (Fresnel Optic, Lamp Burner, all gauges, all hand props). 256 px/m on modular architecture and set dressing. 128 px/m on Rock Base, Skerry Shoal and Sea Surface. Any asset that misses its density by more than 15 % is rejected.

**Maps and formats.** Albedo BC7 sRGB · Normal BC5 (two-channel, tangent-space, +Y up) · ORM packed BC7 with AO in R, Roughness in G, Metallic in B · Emissive BC6H only on Fresnel Optic, Lamp Burner, Keeper's Lantern and the *Ardmore*. No height maps, no detail-normal second UV, no vertex-colour-driven shading except on Sea Surface. Modular architecture shares one 4096 × 4096 trim sheet plus one 4096 × 4096 granite atlas; no modular piece gets a unique texture.

## 6. Lighting keys

Three rigs, composited. Every area in `design/level-design.md` names which rig dominates.

| Rig | Source | Colour temp | Intensity | Behaviour |
|---|---|---|---|---|
| **Lamp Key** | Lamp Burner + Fresnel Optic | 2 200 K, `#F2C879` core to `#FFF6E2` hotspot | 1 400 lx at 1.0 m from the burner; the beam is a 1.10 s sweep every 7.5 s | the only light that moves; casts hard shadows through the Stair Opening down two floors |
| **Storm Fill** | sky dome through Window Splay and Storm Pane | 6 500 K, `#2E4650` | 0.15 lx unlit night interior, 420 lx at a 0.12 s lightning flash (8× ambient) | flat, shadowless, cold; defines the *absence* of the lamp |
| **Hand Key** | Keeper's Lantern | 2 700 K, `#F2C879` | 38 lx at 1.0 m, 2.4 m useful radius, inverse-square falloff | player-controlled, occupies the carry slot, casts a single soft shadow |

Global: no ambient-occlusion-as-lighting cheat, no light probes brighter than 0.4 lx in unlit interiors, no bloom threshold below 2.0 EV, one bloom pass on the Lamp Key only. Exposure adaptation 0.9 EV/s so walking from the Lamp Room into the Watch Room reads as a real change in brightness.

## 7. Do and don't

**Do**
- Author every asset at its real-world size in metres from §8 before UVs are laid out.
- Put the brass rub-through exactly where a hand lands, and nowhere else.
- Make every interactable readable as a black silhouette at 4.0 m.
- Keep the tarred-oak path unbroken from the Oil Cellar to the Lamp Room — the wood shows the player where to walk.
- Bake salt bloom only to faces with an up-vector above 0.60.
- Reuse the modular trim sheet; a new unique texture needs the art lead's sign-off against the §9 budget.
- Ship three damage states for Storm Pane (Intact / Cracked / Broken) and two soot states per Fresnel Optic panel (0 % / 100 %), as material parameters, not as separate meshes.
- Light every asset render with one 2 200 K rim and one 6 500 K fill, per the locked prompt.

**Don't**
- Don't introduce a thirteenth colour, a fifth material family or a second accent metal.
- Don't put Warning Vermilion on any world object, ever — it is UI only.
- Don't use Lamp Gold or Optic White as a base colour; they are emitted light only.
- Don't add electric fittings, wiring, switches, bulbs, plastic, aluminium, stainless steel, printed labels, barcodes or post-1930 typography.
- Don't model ornament, filigree, nautical rope-twist trim or scrimshaw.
- Don't add a second moving light source; the Lamp Key's motion is the game's signature and a competing sweep kills it.
- Don't use uniform roughness across any surface.
- Don't exceed 8 mm chamfers or go below 2 mm.
- Don't let any unique texture exceed 2048 × 2048 except the two 4096 modular sheets and the Storm Sky Dome.
- Don't bake shadows into albedo.
- Don't include human figures, faces or readable text in any generated asset image.

## 8. Asset table

**In slice** = required for the first playable slice defined in `design/vision.md` (Watch Room, Service Stair S7, Lamp Room, Gallery, plus sea, sky, *Ardmore* and Skerry Shoal).

| # | Name | Type | Description | Used in | In slice | Real dimension (m) | Class | Tri budget | Texture |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Tower Wall Segment | mesh | Dressed granite wall, 15° of arc, riveted iron string course at top | every interior floor | Yes | 3.60 tall × 2.20 chord | modular | 1 800 | 4096 shared |
| 2 | Floor Slab | mesh | Granite disc with 1.10 × 1.60 Stair Opening cut, Oxide Red plate centre | every floor | Yes | 4.20 Ø × 0.60 thick | modular | 900 | 4096 shared |
| 3 | Ceiling Rib | mesh | Wrought-iron radial rib, 6 per floor | every floor | Yes | 4.20 span × 0.14 deep | modular | 1 100 | 4096 shared |
| 4 | Stair Flight | mesh | Helical flight, 18 risers at 0.20, 0.28 going at walk line, 175° sweep | Service Stair S1–S7 | Yes (S7) | 3.60 rise × 0.90 clear width | modular | 5 400 | 4096 shared |
| 5 | Stair Handrail | mesh | Tarred oak rail on iron standards | Service Stair S1–S7 | Yes (S7) | 6.20 run × 1.05 tall | modular | 2 400 | 4096 shared |
| 6 | Stair Opening Trim | mesh | Iron nosing and toe-guard around the slab cut | every floor | Yes | 1.10 × 1.60 | modular | 600 | 4096 shared |
| 7 | Interior Door | mesh | Lead-painted plank door, brass thumb latch | 6 interior doorways | No | 0.80 × 1.95 × 0.045 | prop | 1 200 | 1024 |
| 8 | Gallery Door | mesh | Iron storm door, dogs and 0.22 Gallery Storm Sill | Lamp Room to Gallery | Yes | 0.70 × 1.80 × 0.06 | prop | 2 200 | 2048 |
| 9 | Window Splay | mesh | Deep granite reveal with 6-pane sash | Watch Room, Workshop, Store Room, Keeper's Quarters | Yes | 0.55 × 0.95 opening, 0.90 reveal | modular | 800 | 4096 shared |
| 10 | Lantern Frame Segment | mesh | Riveted iron glazing bar, 45° of the lantern, 8 off | Lamp Room | Yes | 1.45 tall × 1.10 chord | modular | 2 600 | 2048 |
| 11 | Storm Pane | mesh | Hand-blown crown glass, Intact / Cracked / Broken material states | Lamp Room lantern, 8 off | Yes | 1.10 × 1.45 × 0.012 | modular | 120 | 1024 |
| 12 | Roof Dome | mesh | Copper dome, seamed, ventilator cowl | above Lamp Room | Yes | 5.40 Ø × 1.70 rise | prop | 4 800 | 2048 |
| 13 | Wind Vane | mesh | Iron vane and cardinal ring on the ventilator | roof apex | Yes | 1.10 tall × 0.72 span | prop | 900 | 512 |
| 14 | Gallery Deck Segment | mesh | Iron grating deck on cantilever brackets, 30° of arc, 12 off | Gallery | Yes | 1.80 arc × 1.15 deep | modular | 700 | 4096 shared |
| 15 | Gallery Rail | mesh | Galvanised rail, 3 bars, 30° of arc, 12 off | Gallery | Yes | 1.80 arc × 1.05 tall | modular | 1 900 | 1024 |
| 16 | Tower Exterior Shell | mesh | Tapered granite drum, 8.40 Ø base to 5.40 Ø at Gallery, string courses | exterior, all views | Yes | 25.2 tall × 8.40 Ø base | modular | 9 000 | 4096 |
| 17 | Rock Base | mesh | Candlewick Point bedrock, tide line, iron mooring ring | tower base, exterior | Yes | 34.0 × 28.0 × 6.2 | prop | 14 000 | 4096 |
| 18 | Fresnel Optic | mesh | Two-panel first-order Fresnel lens in brass carriage on roller race — the hero asset | Lamp Room | Yes | 1.85 tall × 1.40 Ø | prop | 48 000 | 2048 albedo + 2048 ORM |
| 19 | Lamp Burner | mesh | Brass oil-vapour burner, Wick ring, chimney, vaporiser coil | inside Fresnel Optic | Yes | 0.42 tall × 0.26 Ø | prop | 12 000 | 2048 |
| 20 | Wick | mesh | Circular woven wick, 4–14 mm exposed, charred crown state | Lamp Burner | Yes | 0.06 Ø × 0.014 exposed | prop | 400 | 512 |
| 21 | Rotation Drive | mesh | Clockwork train, governor fly, brass escapement, iron frame | Lamp Room floor, under optic | Yes | 0.90 × 0.60 × 0.55 | prop | 16 000 | 2048 |
| 22 | Drive Weight | mesh | Cast-iron cylinder on wire rope, 190 kg | Weight Shaft | No | 0.85 tall × 0.28 Ø | prop | 1 400 | 1024 |
| 23 | Winding Crank | mesh | Removable iron crank with oak handle | Rotation Drive, Store Room rack | No | 0.42 throw × 0.11 handle | prop | 1 800 | 1024 |
| 24 | Rotation Tell-tale | mesh | Brass clicker arm and bell on the drive | Rotation Drive | Yes | 0.14 × 0.06 | prop | 700 | 512 |
| 25 | Day Tank | mesh | Riveted iron oil tank on brackets, filler cap | Watch Room | Yes | 0.70 × 0.70 × 0.90 | prop | 3 400 | 2048 |
| 26 | Oil Sight Glass | mesh | Brass-bodied tube gauge, 0–40 L engraved, float turns Oxide Red below 4 L | Day Tank face | Yes | 0.28 tall × 0.05 Ø | prop | 900 | 1024 |
| 27 | Feed Pressure Gauge | mesh | Brass Bourdon gauge, 0–3.0 bar engraved dial | Watch Room, beside Reservoir Cock | Yes | 0.11 Ø × 0.07 deep | prop | 1 100 | 1024 |
| 28 | Reservoir Cock | mesh | Brass plug cock, 0–90° lever, packing gland | Watch Room, on the Feed Line | Yes | 0.18 lever × 0.09 body | prop | 1 600 | 1024 |
| 29 | Feed Line Run | mesh | 32 mm brass pipe with cleats and unions, straight, 90° and split-union variants | Oil Cellar riser to Lamp Burner via the Pipe Landing trap, 36.0 total | Yes (top 5.4) | 2.00 per segment × 0.032 Ø | modular | 800 | 1024 trim |
| 30 | Oil Reservoir | mesh | Bulk iron oil cistern, 240 L, dipstick boss | Oil Cellar | No | 1.80 × 0.90 × 1.20 | prop | 3 800 | 2048 |
| 31 | Oil Pump | mesh | Hand lift pump, iron body, oak lever, priming cup | Oil Cellar | No | 1.10 tall × 0.34 lever throw | prop | 6 200 | 2048 |
| 32 | Feed Hose | mesh | Canvas-and-wire bypass hose, brass couplings both ends | Store Room rack, Pipe Landing when fitted | No | 3.20 long × 0.038 Ø | prop | 2 600 | 1024 |
| 33 | Wick Trimmer | mesh | Brass circular wick scissors | Watch Desk drawer | Yes | 0.19 × 0.06 | prop | 1 400 | 1024 |
| 34 | Optic Cloth | mesh | Folded chamois, soot-loaded state | Store Room shelf | No | 0.34 × 0.34 folded | prop | 600 | 1024 |
| 35 | Match Tin | mesh | Japanned tin of storm matches, striker strip | Lamp Room shelf | Yes | 0.07 × 0.05 × 0.02 | prop | 800 | 1024 |
| 36 | Keeper's Lantern | mesh | Hand lantern, brass frame, four panes, wire bail | Keeper's Quarters, carried | No | 0.31 tall × 0.14 Ø | prop | 3 200 | 1024 |
| 37 | Watch Telescope | mesh | Brass 3-draw telescope, leather barrel | Watch Desk | Yes | 0.62 extended × 0.06 Ø | prop | 2 800 | 1024 |
| 38 | Logbook | mesh | Ruled station log, ink-stained, ribbon marker | Watch Desk | Yes | 0.30 × 0.21 × 0.04 | prop | 1 600 | 2048 |
| 39 | Oil Can | mesh | Galvanised 4 L can with spout | Oil Cellar, Workshop | No | 0.34 tall × 0.20 Ø | prop | 2 200 | 1024 |
| 40 | Storm Board | mesh | Keeper-made oak board, tarred, rope handle | Store Room, fitted to Storm Pane frame | No | 1.20 × 1.55 × 0.040 | prop | 700 | 1024 |
| 41 | Board Clamp | mesh | Iron screw clamp, 2 needed per Storm Board | Store Room, Gallery | No | 0.22 × 0.09 | prop | 1 100 | 512 |
| 42 | Watch Desk | mesh | Tarred oak desk, single drawer, chalk tray | Watch Room | Yes | 1.30 × 0.62 × 0.78 | prop | 3 600 | 2048 |
| 43 | Bearing Board | mesh | Slate board with engraved bearing scale and chalk marks | Watch Room wall | Yes | 0.90 × 0.60 × 0.02 | prop | 500 | 2048 |
| 44 | Tool Rack | mesh | Iron wall rack with silhouetted tool outlines painted on | Workshop, Store Room | No | 1.40 × 0.24 × 0.32 | prop | 2 400 | 1024 |
| 45 | Store Shelf | mesh | Open timber shelving, 4 tiers | Store Room | No | 1.80 × 0.45 × 2.10 | modular | 1 800 | 1024 |
| 46 | Oil Drum | mesh | Oxide Red iron drum, 205 L, draggable | Oil Cellar, Store Room | No | 0.88 tall × 0.58 Ø | prop | 1 200 | 1024 |
| 47 | Keeper's Bunk | mesh | Iron-framed bunk, wool blanket, curved to the wall | Keeper's Quarters | No | 1.95 × 0.85 × 0.95 | prop | 2 800 | 1024 |
| 48 | Range Stove | mesh | Cast-iron range, kettle plate, flue | Keeper's Quarters | No | 0.92 × 0.58 × 0.86 | prop | 4 200 | 2048 |
| 49 | Kettle | mesh | Copper kettle, soot-blackened base | Range Stove | No | 0.24 tall × 0.20 Ø | prop | 900 | 512 |
| 50 | Windsor Chair | mesh | Spindle-back oak chair, worn seat | Watch Room, Keeper's Quarters | Yes | 0.94 tall × 0.46 × 0.44 | prop | 2 200 | 1024 |
| 51 | Rain Cape on Hook | mesh | Oilskin cape and sou'wester on an iron hook | Keeper's Quarters, Pipe Landing | No | 1.35 × 0.62 hanging | prop | 1 800 | 1024 |
| 52 | Galvanised Bucket | mesh | Zinc bucket, dented, wire bail | Workshop, Gallery | Yes | 0.30 tall × 0.28 Ø | prop | 900 | 512 |
| 53 | Coil of Rope | mesh | Tarred manila coil on a pin | Store Room, Gallery | No | 0.46 Ø × 0.16 tall | prop | 2 400 | 1024 |
| 54 | Keeper's Hands | mesh | First-person forearms and hands, oilskin cuff, 11 animation-driving bones per hand | all carry and interact animations | Yes | 0.19 hand length, 0.62 forearm reach | character | 9 000 | 2048 |
| 55 | Ardmore | mesh | Coastal steam coaster, single funnel, masthead and side lights, 3 LODs from 620 m to 8 000 m | sea, all exterior views | Yes | 58.0 LOA × 9.2 beam × 4.4 draught | prop | 6 000 LOD0 / 1 400 LOD1 / 320 LOD2 | 1024 |
| 56 | Herring Gull | mesh | Perching and gliding gull, 9 bones, 3 looped animations | Gallery Rail, exterior | No | 0.62 length × 1.44 wingspan | character | 3 400 | 1024 |
| 57 | Sea Surface | mesh | Tiling displaced water plane, 6-stage sea-state parameter set | all exterior views | Yes | 240 × 240 per tile, 6.5 max wave height | modular | 32 000 | 1024 × 3 maps |
| 58 | Skerry Shoal | mesh | Exposed reef with surf collar, 3.2 above datum | sea, bearing 128° at 1 480 m | Yes | 210 × 90 × 3.2 | prop | 9 000 | 2048 |
| 59 | Storm Sky Dome | mesh | Inverted dome, layered cloud, lightning-flash emissive channel | everywhere | Yes | 12 000 radius | prop | 1 200 | 4096 |

**Slice asset count:** 31 of 59 rows are in slice.

## 9. Platform and budget

**Targets:** PC (Windows 11, Linux/Proton) at 2560 × 1440 / 60 fps on the PC reference (8-core CPU, 8 GB-class GPU), and Steam Deck at 1280 × 800 / 60 fps. No console, no mobile, no VR.

| Budget line | Limit |
|---|---|
| On-screen triangles, worst frame | 1 800 000 |
| On-screen triangles, slice worst frame (measured against §8 rows) | 900 000 including 3 shadow cascades |
| Draw calls per frame | 900 |
| Real-time shadow-casting lights per frame | 3 (Lamp Key, Hand Key, 1 lightning) |
| Unique material instances | 140 |
| Unique texture sets | 46 |
| Texture memory resident | 1.10 GB |
| Texture memory, full set on disk (BC7/BC5/BC6H) | 3.20 GB |
| Total build size | 9.0 GB |
| Skinned meshes on screen | 2 (Keeper's Hands, Herring Gull) |
| Particle count on screen | 14 000 (rain at Storm Stage 5) |
| Bone count per skinned mesh | 24 |
| Animation clips, whole game | 62 |
| Reflection probes | 12, baked, 128 px cube |
| Lightmap resolution | 12 px/m on architecture, no lightmaps on props |
| LODs per asset above 4 000 tris | 3, at screen heights 100 % / 35 % / 12 % |
| Import scale check | every asset's bounding box matches its §8 dimension within ±2 % |
