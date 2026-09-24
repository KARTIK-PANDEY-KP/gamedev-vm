# CANDLEWICK LIGHT — Level Design

Companion to `design/vision.md`, `design/game-design.md` and `design/art-bible.md`. Every area, asset, fault and mechanic name below is the canonical name used in all five documents.

---

## 1. Setting

**Candlewick Light**, a 25.2 m granite tower standing on the seaward tip of **Candlewick Point**, a basalt headland on the exposed North Atlantic coast. The night is **21 October 1904**, from 23:10 to first light. Wind is onshore from 242°, rising from 14 m/s to 32 m/s across the Night. **Skerry Shoal** lies 1 480 m out on bearing 128° — a 210 m × 90 m reef standing 3.2 m above datum, awash at this sea state and invisible from the water without the light.

The whole game takes place inside one cylinder 8.40 m across at the base and 5.40 m across at the Gallery, plus 10.7 m² of exterior walkway. There is no second location, no interior/exterior transition other than the Gallery Door, and no travel by any means other than the player's legs.

### Worldbuilding answers

**Who made this place.** The **Northern Lights Board** commissioned Candlewick Light in 1869 and lit it on 4 March 1871. Engineer **Ewan Tait** designed the tower — dressed granite laid in 34 courses, dovetailed for the first 6.2 m, with an internal clear diameter of 4.20 m and walls tapering from 2.10 m thick at the base to 0.90 m at the Gallery. The two-panel first-order **Fresnel Optic** and its clockwork **Rotation Drive** were built by **Barrow & Sons of Leith** and installed in 1888, replacing a fixed catoptric apparatus; the bolt holes of the old apparatus are still in the Lamp Room floor, 0.32 m out from the current ones, and are the only visible evidence of the tower's earlier life. Everything the player touches is 16 to 35 years old, maintained by hand, and repaired more often than replaced.

**Who lives here now.** Two keepers are appointed to Candlewick: Principal Keeper **Iona Rekk** (the player) and Assistant Keeper **Dòmhnall Blair**. The relief boat failed to make the landing on 19 October 1904 and Blair is ashore at the shore station, 11 km away across water no boat is crossing tonight. So the tower holds one person. Blair's presence is everywhere and his body is nowhere: his bunk is made, his boots are by the **Range Stove**, his handwriting fills the left-hand column of the **Logbook** up to 19 October, and his **Rain Cape on Hook** still hangs on **Landing L4**. No character other than the player exists as an entity. Nothing speaks.

**How the player can change this place.** Only by operating it. There is no building, placing, decorating, destroying or permanent alteration. The world's state *is* the machine's state, and the player changes that state seven ways: the **Reservoir Cock** angle (0–90°), the **Day Tank** and **Oil Reservoir** oil levels (litres), the **Drive Weight** height (0–18.0 m), **Soot** on each of the two **Fresnel Optic** panels (0–100 %), **Storm Pane** integrity (8 panes, 3 states each), the **Feed Line** state (Sound / Cracked / Bypassed), and **Flame Height** (0–90 mm). Two changes persist visibly to the end of the Night and are the game's only monuments: the **Storm Board** bolted over the broken pane on the Gallery, and the **Feed Hose** coupled across the split union on the **Pipe Landing** — both obviously improvised, both obviously holding — the **Feed Hose** sits on the **Pipe Landing** manifold at +18.00 m, and the **Storm Board** on the **Gallery** at +25.20 m. The third persistent change is the five pages the player writes in the **Logbook**.

---

## 2. Metrics

3D first-person. Tile size and tiles-per-screen do not apply; the 3D equivalents (grid module, floor-to-floor, clear diameter) are given instead.

| Metric | Value | Derivation / note |
|---|---|---|
| Grid module | 0.30 m | all prop placement snaps to this |
| Architectural module (floor-to-floor) | 3.60 m | 12 grid modules |
| Floor slab thickness | 0.60 m | granite on iron beams |
| Interior clear height | 3.00 m | from 3.60 m floor-to-floor − 0.60 m slab |
| Interior clear diameter | 4.20 m all floors | 13.85 m² gross per floor (π × 2.10²) |
| Walkable floor per interior area | 11.6–12.4 m² | gross 13.85 m² − 1.76 m² Stair Opening − dressing |
| Player capsule | 1.80 m tall × 0.60 m Ø | eye height 1.68 m, crouch 1.20 m / eye 1.05 m |
| Player shoulder clearance needed | 0.70 m | no passable gap in the game is narrower |
| Walk / Hurry / Brace / Crouch speed | 2.60 / 4.20 / 1.40 / 1.10 m/s | |
| Distance covered in 1 s of walk | 2.60 m | |
| Full-floor crossing, wall to wall | 4.20 m = 1.62 s at walk speed | |
| Interior door | 0.80 m × 1.95 m | leaf 0.045 m thick |
| Gallery Door | 0.70 m × 1.80 m, with 0.22 m Gallery Storm Sill | the only jump-or-step threshold in the game |
| Oil Cellar hatch | 0.75 m × 0.75 m | crouch required |
| Conduit Crawl clear section | 1.10 m high × 0.80 m wide, 4.20 m long | Brace speed 1.40 m/s, crouch forced |
| Stair clear width | 0.90 m | Service Stair S1–S7 |
| Stair walk-line radius | 1.65 m | measured from tower axis |
| Stair riser / going | 0.20 m / 0.28 m at walk line | 18 risers per 3.60 m floor |
| Stair pitch | 35.5° | atan(0.20 / 0.28) |
| Stair sweep per floor | 175° | from 18 × 0.28 m = 5.04 m walk-line run ÷ (2π × 1.65 m) |
| Stair path length per floor | 6.20 m | √(5.04² + 3.60²) |
| Stair Opening in each slab | 1.10 m radial × 1.60 m chord | 1.76 m² |
| Cellar Ladder | 3.60 m rise at 60°, 4.16 m length, 0.42 m wide | 0.75 m/s up, 1.00 m/s down |
| Gallery deck width | 1.15 m | ring circumference 16.96 m (π × 5.40 m) |
| Gallery Rail height | 1.05 m | |
| Window Splay opening / reveal depth | 0.55 m × 0.95 m / 0.90 m | |
| Wall thickness, base / Gallery | 2.10 m / 0.90 m | |
| Tower height, base to Lamp Room floor | 25.2 m | 7 modules of 3.60 m |
| Tower height, base to Roof Dome apex | 30.1 m | 25.2 + 1.45 lantern + 1.70 dome + 1.75 ventilator and vane |
| Oil Cellar floor | −3.60 m | |
| Total vertical range | 28.8 m | −3.60 m to +25.20 m |
| Full ascent, Oil Cellar to Lamp Room | 31.3 s | 3.60 m ÷ 0.75 m/s ladder + 25.20 m ÷ 0.95 m/s stair |
| Full descent, Lamp Room to Oil Cellar | 23.8 s | 25.20 m ÷ 1.25 m/s stair + 3.60 m ÷ 1.00 m/s ladder |
| One floor, up / down | 3.79 s / 2.88 s | 3.60 m ÷ 0.95 and ÷ 1.25 m/s |
| Max designed jump gap | 0.80 m | capability is 1.09 m; 0.29 m margin |
| Max designed step-up without jump | 0.28 m | equals step offset |
| Fall Injury threshold | 4.00 m | only reachable at the Stair Opening and the Weight Shaft |
| Longest sightline, interior | 8.00 m | Lamp Room floor to Store Room floor down the Stair Opening stack, only when 3 doors are open |
| Longest sightline, exterior | 12 000 m | Far camera far plane; *Ardmore* at 8 000 m, Skerry Shoal at 1 480 m |

---

## 3. Areas

Thirteen areas. Listed bottom to top, then traversal spaces.

### 3.1 Oil Cellar — −3.60 m

- **Purpose.** The bulk oil store, and the place the **Dead Feed Line** bypass has to be purged. The **Oil Pump** is the only device in the tower that can push oil, so the last fault's final act happens 28.8 m from the lamp — the one place in the game below the sea's apparent level and the furthest point from the light.
- **Theme.** The tower's gut. Unrendered granite, no plaster, iron everywhere, oil on the floor.
- **Mood.** Buried and close. The storm is inaudible here except as a 40–90 Hz pressure in the rock, which makes it worse, not better.
- **Palette reference.** `#16262E` Slate Sea walls, `#0B1418` Deep Storm Black in every recess, `#6E2E24` Oxide Red on the **Oil Drum** and pump frame, `#C2A15A` Brass on the **Oil Pump** lever and priming cup. No `#8C8578` Lime Render at this level.
- **Landmarks.** The **Oil Reservoir** (1.80 × 0.90 × 1.20 m, 240 L) against the north arc; the **Oil Pump** at 1.10 m tall directly under the foot of the **Feed Line Run** riser, which climbs 25.2 m from here to the **Day Tank**; a brass pressure tell-tale on the riser at 1.40 m that reads air until the purge is complete and oil after; three **Oil Drum**s on the west arc; a 0.30 m drain channel cut into the floor.
- **Encounters.** Dead Feed Line observations 4 and 5 and repair acts 4 and 5 — prime the **Oil Pump** (0.40 L, 2.2 s), then work it in cadence for 18.0 s to purge 4.0 L of air out of the bypassed line. Ambient: the riser rings faintly at 110–380 Hz whenever oil is flowing 25.2 m above, which means the player can hear the state of the lamp from the bottom of the tower.
- **Mechanics it introduces.** Prime (0.40 L, 2.2 s), Pump (tap at 1.6–2.4 Hz for 0.22 L/s), crouching through the 0.75 × 0.75 m Oil Cellar hatch, and the **Cellar Ladder** (3.60 m at 60°, 0.75 m/s up).
- **Expected playtime.** 1.2 min per Night, all of it inside the Dead Feed Line cycle.
- **Lighting key.** **Hand Key** only — this is the one area with no Lamp Key and no Storm Fill. Without the **Keeper's Lantern** the ambient floor is 0.02 lx and the player cannot read the split union. That is the design: the last fault is solved in the dark, one-handed.
- **Layout sketch.**

```
            N  Oil Reservoir 240 L
        ┌────────────█████████───────┐
        │  drain channel ~~~~~~~~~   │
   Oil  █  ▲ Feed Line Run riser     │
  Drums █  ⊙ pressure tell-tale @1.40 m
   ×3   █  ▓ Oil Pump (1.10 m)       █ Cellar
        │                            █ Ladder
        └────────────╫───────────────┘  ↑ 3.60 m at 60°
              hatch 0.75×0.75 ↑ to 0.0 m
        4.20 m clear Ø · ceiling 3.00 m
```

- **Audio reference.** A stone-lined pumping station: 40–90 Hz rock-borne rumble at −28 dBFS, RT60 0.9 s with a 62 Hz room mode, iron pump squeal at 1.2–2.6 kHz, and a 110–380 Hz oil ring in the riser that is the lamp's state heard from 28.8 m below. Reference direction: the below-decks beds of *The Lighthouse* (2019) with the wind removed.

### 3.2 Keeper's Quarters — 0.00 m

- **Purpose.** Establish that a person lives here, and that there are two of them and only one is home. Start point of the Night (the Night actually begins in the Watch Room; the Quarters is visited voluntarily).
- **Theme.** A small round home. Two bunks curved to the wall, a range, a table with two chairs and one used cup.
- **Mood.** Warm and abandoned in the same frame. The only room in the tower that smells of tea rather than paraffin.
- **Palette reference.** `#8C8578` Lime Render walls, `#3A2A1E` Tarred Oak furniture, `#6E2E24` Oxide Red door and floor plate, `#F2C879` Lamp Gold pooled at the **Range Stove**.
- **Landmarks.** Two **Keeper's Bunk**s (1.95 × 0.85 m), Blair's made and Rekk's not; the **Range Stove** with the **Kettle** still warm; the **Keeper's Lantern** on its hook beside the door — the player's only portable light and the reason to come down here before the Night gets hard; Blair's boots, paired, under his bunk.
- **Encounters.** None scripted. Ambient: the **Range Stove** flue moans at Storm Stage ≥ 3, rising 6 dB per stage.
- **Mechanics it introduces.** Toggle Lantern; the single carry slot is first felt here, because taking the **Keeper's Lantern** means putting down whatever else you had.
- **Expected playtime.** 0.4 min per Night.
- **Lighting key.** **Hand Key** dominant, with a 0.4 lx `#F2C879` bounce from the stove grate. **Storm Fill** through one **Window Splay** at 0.15 lx.
- **Layout sketch.**

```
              N   Window Splay (0.55×0.95)
        ┌──────────░░─────────────┐
 Bunk   ▬▬▬▬                      │
 (Blair)│         ◻ table         █ Stair
 Bunk   ▬▬▬▬      ⌒ 2 chairs      █ Opening
 (Rekk) │   ▣ Range Stove + Kettle │  ↑ S1
        │   ¶ Keeper's Lantern hook│
        └───────────╫──────────────┘
                 hatch 0.75×0.75 ↓ Oil Cellar
```

- **Audio reference.** A stone cottage in a gale: RT60 0.55 s, storm bed at −34 dBFS band-limited below 400 Hz, coal settling in the grate every 18–40 s, one loose sash rattle at 4.2 Hz during gusts.

### 3.3 Workshop — +3.60 m

- **Purpose.** Teach the tower's vocabulary of tools before any tool is needed. Nothing here is required by any fault; everything here explains what the required tools are for.
- **Theme.** A machinist's bench in a round room. Painted silhouettes on the **Tool Rack** show where absent tools belong.
- **Mood.** Competent and orderly, which reads as reassurance early and as reproach later, when a tool is not where its silhouette says.
- **Palette reference.** `#8C8578` Lime Render, `#5C6B6A` Weathered Zinc rack and vice, `#C2A15A` Brass on the bench, `#3A2A1E` Tarred Oak benchtop.
- **Landmarks.** A 1.40 m **Tool Rack** with two empty silhouettes — a **Winding Crank** and a **Feed Hose** — both of which actually live one floor up in the **Store Room**, which is the game's only misdirection and is resolved by a chalked note in Blair's hand; a bench vice at 0.92 m; two **Oil Can**s; a **Galvanised Bucket** catching a roof leak at 0.4 Hz.
- **Encounters.** None. Optional discovery only.
- **Mechanics it introduces.** Take and Place at a socket with the 0.35 m / 25° snap, practised on the bench vice with zero stakes.
- **Expected playtime.** 0.3 min per Night.
- **Lighting key.** **Storm Fill** dominant at 0.15 lx with one **Window Splay**; **Lamp Key** reaches here down the Stair Opening stack as a 7.5 s pulse at 0.9 lx when the doors above are open, which is how the player learns the beam's rhythm is audible-by-light through the whole tower.
- **Layout sketch.**

```
            N
      ┌─────────░░────────────┐
      │  ▭▭▭ bench + vice     █ Stair
 Tool ╬╬╬  (2 empty outlines) █ Opening
 Rack │   ⌷ Oil Can ×2        │  ↑ S2 / ↓ S1
      │   ∪ Galvanised Bucket │
      └───────────────────────┘
```

- **Audio reference.** A cold machine shop: RT60 0.7 s with 1.6 kHz flutter off the render, 0.4 Hz water drip into a zinc bucket (bright, 2–5 kHz attack), storm bed −32 dBFS.

### 3.4 Store Room — +7.2 m

- **Purpose.** The tool depot. Three of the five faults route through this floor, which makes +7.2 m the tower's second centre of gravity after the Lamp Room and gives the climb its shape: 18.0 m down, grab, 18.0 m back up.
- **Theme.** Deep shelving in a round room, everything labelled in chalk, the **Weight Shaft** opening at the north arc with the **Drive Weight**'s wire rope running down through it.
- **Mood.** Purposeful. The one room where being in a hurry is correct.
- **Palette reference.** `#8C8578` Lime Render, `#3A2A1E` Tarred Oak shelving, `#5C6B6A` Weathered Zinc on the **Feed Hose** couplings, `#0B1418` Deep Storm Black down the Weight Shaft.
- **Landmarks.** Four **Store Shelf** units (1.80 × 0.45 × 2.10 m) on the south and west arcs; the **Tool Rack** holding the **Winding Crank** and the **Feed Hose**; the **Optic Cloth** and **Storm Board** with two **Board Clamp**s on the top shelf at 1.62 m; the **Weight Shaft** head opening, 0.90 × 0.90 m, unguarded except by a 0.45 m lip — the game's one Fall Injury hazard the player will actually meet.
- **Encounters.** Clouded Optic act 1 (take **Optic Cloth**), Stalled Rotation act 1 (take **Winding Crank**), Shattered Storm Pane act 1 (take **Storm Board** and two **Board Clamp**s), Dead Feed Line act 2 (take **Feed Hose**).
- **Mechanics it introduces.** The single-carry-slot cost at its sharpest — the **Storm Board** is carried, which caps stair ascent at 0.62 m/s vertical, turning the 18.0 m climb from 18.9 s into 29.0 s.
- **Expected playtime.** 1.5 min per Night, across four separate visits.
- **Lighting key.** **Storm Fill** at 0.15 lx, one **Window Splay**; **Hand Key** if carried; a 0.9 lx **Lamp Key** pulse every 7.5 s down the Stair Opening. The **Weight Shaft** opening is a black rectangle in all conditions and reads as a hole from 4.0 m.
- **Layout sketch.**

```
              N   Weight Shaft head 0.90×0.90 (0.45 m lip)
        ┌──────────▓▓▓───────────┐
 Store  ▤▤▤   wire rope ↓        █ Stair
 Shelf  ▤▤▤                      █ Opening
  ×4    ▤▤▤  ╬ Tool Rack:        │  ↑ S4 / ↓ S3
        ▤▤▤     Winding Crank    │
        │  ░ Window Splay        │
        │  Optic Cloth · Storm Board · 2 Board Clamps · Feed Hose
        └────────────────────────┘
```

- **Audio reference.** A dry timber store over an open shaft: RT60 0.6 s local, plus a 1.4 s shaft tail from the Weight Shaft with a 38 Hz mode; wire rope creak at 0.3 Hz; chalk-dry shelf handling foley.

### 3.5 Landing L4 — +10.80 m

- **Purpose.** The halfway breath on every climb. Its only job is to be the place the player notices they are out of Breath.
- **Theme.** A bare landing with one window and one hook.
- **Mood.** Stalled. No machine, no tool, no task.
- **Palette reference.** `#8C8578` Lime Render, `#5C6B6A` Weathered Zinc rail, `#3A2A1E` Tarred Oak on Blair's **Rain Cape on Hook**.
- **Landmarks.** Blair's **Rain Cape on Hook**, dry, 1.35 m; a **Window Splay** that looks straight down 10.8 m onto the **Rock Base** and the tide line — the only view in the tower that shows how far up you are.
- **Encounters.** None. Ambient: a 0.9 s spray hit on the window at Storm Stage ≥ 3, every 14–22 s.
- **Mechanics it introduces.** Nothing new. Breath recovery is 8.0/s standing here, 11.0/s if the player holds Lean-in at the window — the game's only reward for stopping.
- **Expected playtime.** 0.2 min per Night, in 6–9 passes of 1.5–2.5 s each.
- **Lighting key.** **Storm Fill** at 0.15 lx; 420 lx lightning flashes read hardest here because the window is unshuttered.
- **Layout sketch.**

```
        N
   ┌───────░░────────┐
   │  ¶ Rain Cape    █ Stair Opening
   │                 █  ↑ S5 / ↓ S4
   └─────────────────┘   1.10×1.60
```

- **Audio reference. ** Stairwell tone, RT60 1.1 s, 180–400 Hz emphasised by the shaft; single glass-and-putty rattle; distant surf on rock at −30 dBFS, 8 s period.

### 3.6 Landing L5 — +14.40 m

- **Purpose.** The storm's loudest interior point, placed deliberately at the climb's hardest moment so the weather peaks where the player's Breath is lowest.
- **Theme.** Identical shell to Landing L4 and deliberately near-identical dressing, so the player's sense of height comes from the window view and the audio, not from landmarks.
- **Mood.** Loud and exposed even though nothing is open.
- **Palette reference.** Same as Landing L4, with `#2E4650` Iron Blue bleeding further in through a drumming **Window Splay**.
- **Landmarks.** A **Window Splay** whose sash drums at 4.8 Hz in gusts; a 0.9 m section of the **Feed Line Run** riser crossing the wall at 1.40 m with a brass level plate stamped "+14.4", which rings at 110–380 Hz for as long as the **Oil Pump** is being worked 18.0 m below — the only place in the tower where the riser's sound is at head height, and the reason the player recognises that ring when they hear it in the **Oil Cellar** during Dead Feed Line.
- **Encounters.** None. This is the tower's designed rest-and-dread beat.
- **Mechanics it introduces.** Nothing. It teaches the **Feed Line Run** as a readable, audible object, which pays off in Dead Feed Line observations 3 and 4.
- **Expected playtime.** 0.2 min per Night.
- **Lighting key.** **Storm Fill** at 0.15 lx. No Lamp Key reaches this far down once the Watch Room door is shut, which is the point.
- **Layout sketch.**

```
        N
   ┌───────░░────────┐   sash drums 4.8 Hz
   │ ═══ Feed Line Run @1.40 m
   │                 █ Stair Opening
   │                 █  ↑ S6 / ↓ S5
   └─────────────────┘
```

- **Audio reference.** Peak interior storm: wind at −18 dBFS with a 210 Hz whistle through the sash, RT60 1.1 s, gust attack 1.2 s / decay 2.1 s, plus the player's own breathing layer crossfading at Breath 70 / 40 / 15.

### 3.7 Pipe Landing — +18.00 m

- **Purpose.** The service junction, and the **Dead Feed Line** fault site. Entry to the **Weight Shaft** via the **Conduit Crawl**, and the observation point for two faults.
- **Theme.** All pipe and no plaster. The **Feed Line Run** drops 3.6 m from the **Day Tank** to the settling trap on this floor and rises 7.2 m from here to the **Lamp Burner**; valve labels are stamped brass.
- **Mood.** Technical and cramped. The first place that feels like the inside of a machine rather than a building.
- **Palette reference.** `#5C6B6A` Weathered Zinc pipework, `#C2A15A` Brass unions and labels, `#16262E` Slate Sea bare granite, no Lime Render.
- **Landmarks.** The **Feed Line Run** manifold and settling trap at 1.30 m with four stamped brass labels — the union on its east side is the **Dead Feed Line** split, and is the lowest point in the 36.0 m line, which is why it is the one that fails; the **Conduit Crawl** mouth, 1.10 × 0.80 m, at floor level on the north arc; a second **Rain Cape on Hook**, Rekk's, wet.
- **Encounters.** Stalled Rotation observations 3 and 4 (crawl in, see the **Drive Weight** bottomed at 0.4 m). Dead Feed Line observation 3 and repair act 3: the split union at 1.30 m with oil across 2.4 m² of floor, and the **Feed Hose** coupled across it in 8.0 s. The leak runs at 0.35 L/s from fault onset until the **Reservoir Cock** is shut 3.6 m above.
- **Mechanics it introduces.** Crouch-and-Brace traversal in the **Conduit Crawl** at 1.40 m/s over 4.20 m with Hurry disabled, and Place at a socket under time pressure (0.35 m / 25° snap, 8.0 s coupling).
- **Expected playtime.** 0.8 min per Night, in 3 visits (two on the Dead Feed Line route, one on Stalled Rotation).
- **Lighting key.** **Storm Fill** at 0.15 lx with no window — light arrives only down the Stair Opening. **Hand Key** strongly recommended; the **Conduit Crawl** is 0.03 lx without it.
- **Layout sketch.**

```
              N   Conduit Crawl mouth 1.10×0.80 → Weight Shaft
        ┌──────────▭▭▭───────────┐
        │  ↓ from Day Tank +21.60 │
        │  ═╬═ manifold + trap @1.30 m
        │   (4 brass labels)     █ Stair
        │   ⊙ split union ──────► Feed Hose site
        │  ¶ Rain Cape (wet)     █ Opening
        │  ↑ to Lamp Burner +25.20│  ↑ S7 / ↓ S6
        └────────────────────────┘
```

- **Audio reference.** A pipe gallery: RT60 0.8 s with strong 500 Hz–2 kHz metallic ring, oil flowing in a 32 mm pipe as a 110–380 Hz hiss that stops dead when the **Reservoir Cock** shuts, wire-rope tick from the shaft at 0.3 Hz.

### 3.8 Weight Shaft — +7.20 m to +25.20 m

- **Purpose.** Make the **Rotation Drive**'s power source physical and visible. The **Drive Weight** falling 18.0 m at 0.0075 m/s is a clock the player can look at.
- **Theme.** An 18.0 m vertical void, 0.90 × 0.90 m, granite-lined, with one wire rope down the middle.
- **Mood.** Vertiginous. The only place in the game where looking down means something.
- **Palette reference.** `#0B1418` Deep Storm Black, `#16262E` Slate Sea on the lining, one `#C2A15A` Brass depth plate every 3.60 m.
- **Landmarks.** The **Drive Weight** itself (0.85 m × 0.28 m Ø, 190 kg), whose height off the shaft floor *is* the Rotation System's state; five brass depth plates stamped at 3.60 m intervals so the player can read the weight's height numerically; the wire rope.
- **Encounters.** Stalled Rotation observation 4 — the weight resting at 0.4 m with the rope slack. The shaft's 0.45 m lip in the **Store Room** is the game's Fall Injury site: a 7.2 m drop from the Store Room lip to the shaft floor, well over the 4.00 m threshold.
- **Mechanics it introduces.** Reading a mechanical state off a physical position instead of a gauge.
- **Expected playtime.** 0.7 min per Night, viewed from the **Conduit Crawl** and the **Store Room** lip; never entered.
- **Lighting key.** **Hand Key** only, 2.4 m radius, which means the player can never see the whole 18.0 m at once and must read the nearest brass depth plate to know where the weight is.
- **Layout sketch.**

```
  +25.20 ─┬─ Rotation Drive head, rope drum
          │  ▪ brass depth plate  18.0
  +21.60 ─┤  ▪ 14.4
  +18.00 ─┤◄─ Conduit Crawl mouth   ▪ 10.8
  +14.40 ─┤  ▪ 7.2
  +10.80 ─┤  ▪ 3.6
   +7.20 ─┴─ Store Room lip (0.45 m) · shaft floor at +7.20
           ▮ Drive Weight, 190 kg, on wire rope
           0.90 × 0.90 m clear
```

- **Audio reference.** A deep lift shaft: RT60 1.9 s with a 38 Hz axial mode and a 4.1 kHz flutter echo, wire-rope creak at 0.3 Hz, ratchet tick from the drive head every 3.75 s that stops the moment the weight bottoms.

### 3.9 Watch Room — +21.60 m

- **Purpose.** The keeper's post and the game's diagnostic hub. Every gauge that reports on the Oil System is on this floor, one flight below the lamp. **In the first slice.**
- **Theme.** A round office inside a machine. Desk, slate, telescope, oil tank, brass.
- **Mood.** The tower's only calm room, and the room where all the bad news arrives.
- **Palette reference.** `#8C8578` Lime Render, `#3A2A1E` Tarred Oak on the **Watch Desk** and **Windsor Chair**, `#C2A15A` Brass on the **Reservoir Cock**, **Feed Pressure Gauge**, **Oil Sight Glass** and **Watch Telescope**, `#6E2E24` Oxide Red on the floor plate and the low-oil float.
- **Landmarks.** The **Watch Desk** (1.30 × 0.62 × 0.78 m) with the **Logbook** open on it and the **Wick Trimmer** in its single drawer; the **Bearing Board** (0.90 × 0.60 m) chalked with the *Ardmore*'s bearing; the **Day Tank** (40.0 L) with its **Oil Sight Glass** on the north arc; the **Reservoir Cock** and **Feed Pressure Gauge** together at 1.24 m on the east arc, 3.2 m from the desk; the **Watch Telescope** on the desk; one **Window Splay** on bearing 116°, looking straight at where the *Ardmore* will be.
- **Encounters.** Wick Drain observations 1–3 and repair act 1; Dead Feed Line observations 1–2 and repair acts 1 and 5. The Night starts here, seated, at 23:10.
- **Mechanics it introduces.** Lean-in on a gauge; sustained-hold Interact (3.0 s on the **Reservoir Cock**); Take from a container (the drawer); **Watch Telescope** at 6.0×; the **Logbook**.
- **Expected playtime.** 4.5 min per Night.
- **Lighting key.** **Lamp Key** dominant — the beam comes down the Stair Opening and sweeps the ceiling every 7.5 s at 6.5 lx, and its absence is the first thing the player notices when a fault fires. **Storm Fill** at 0.15 lx through the **Window Splay**.
- **Layout sketch.**

```
                      N   Day Tank 40 L + Oil Sight Glass
              ┌──────────▣▣▣──────────┐
              │                       │
  Bearing  ▤  │    ◻ Watch Desk       █ Stair Opening
  Board       │      (Logbook,        █  ↑ S7 to Lamp Room
              │       Watch Telescope,│  ↓ S6
              │       drawer: Wick    │
              │       Trimmer)        │
              │    ⌒ Windsor Chair    ╬ Reservoir Cock @1.24 m
              │                       ◉ Feed Pressure Gauge
              └──────────░░───────────┘
                  Window Splay, bearing 116°
        desk to Reservoir Cock: 3.20 m = 1.23 s at walk speed
```

- **Audio reference.** A wooden-floored watch office in a stone tower: RT60 0.50 s, storm bed −30 dBFS, the **Rotation Drive** ratchet arriving from above at −38 dBFS every 3.75 s, a wall clock at 1.0 Hz, chalk on slate foley, and a 110–380 Hz oil hiss in the **Feed Line Run** that is the room's quietest and most important sound.

### 3.10 Lamp Room — +25.20 m

- **Purpose.** The reason the game exists. Where every fault is seen first and every fault is finished. **In the first slice.**
- **Theme.** A glass drum around a brass machine. 8 **Lantern Frame Segment**s, 8 **Storm Pane**s, and the **Fresnel Optic** turning in the middle of them.
- **Mood.** Awe when lit, dread when not. The brightest and the darkest room in the game are the same room.
- **Palette reference.** `#C2A15A` Brass and `#F2C879` Lamp Gold dominate when lit, with an `#FFF6E2` Optic White core; `#2E4650` Iron Blue and `#0B1418` Deep Storm Black dominate when unlit. `#8C8578` Lime Render does not appear at this level.
- **Landmarks.** The **Fresnel Optic** (1.85 m × 1.40 m Ø) on its roller race at the room's axis, turning at 4.0 rpm; the **Lamp Burner** and **Wick** inside it; the **Rotation Drive** and **Rotation Tell-tale** at floor level on the south arc; the **Match Tin** on a brass shelf at 1.18 m by the **Gallery Door**; the 1888 bolt holes of the old catoptric apparatus in the floor, 0.32 m out from the current ones; the **Gallery Door** on bearing 242°, into the wind.
- **Encounters.** All five fault symptoms fire here. Wick Drain acts 2–3; Clouded Optic acts 2–3; Stalled Rotation acts 2–3; Shattered Storm Pane symptom and final relight; Dead Feed Line act 6.
- **Mechanics it introduces.** Trim (3 × 1.6 s), Wipe (2.4 s per panel), Light (match window 6.0 s, Flame 0 → 82 mm in 2.2 s), Wind (fit the **Winding Crank**, 1.4–1.8 rev/s), and the whole legibility rule that the light must be *readable* and not merely bright.
- **Expected playtime.** 9.5 min per Night — 37 % of the Night, the largest single figure in the game.
- **Lighting key.** **Lamp Key** at 1 400 lx at 1.0 m from the burner when lit, sweeping at 7.5 s; when unlit, **Storm Fill** at 0.15 lx through the glazing, which is dark enough that the **Match Tin** must be found by memory. Exposure adaptation of 0.9 EV/s makes the relight feel like a physical event.
- **Layout sketch.**

```
        Roof Dome above (5.40 Ø), ventilator, Wind Vane
              N
      ┌─── Storm Pane ×8 in Lantern Frame Segment ×8 ───┐
      ░░                                              ░░
      ░░        ◎ Fresnel Optic 1.85 × 1.40 Ø         ░░
      ░░        ├─ Lamp Burner 0.42 m + Wick          ░░
      ░░        └─ 4.0 rpm, Fl W 7.5 s                ░░
      ░░   ▓ Rotation Drive + Rotation Tell-tale      ░░
      ░░   ▪ Match Tin @1.18 m      █ Stair Opening   ░░
      └───────── ╫ Gallery Door, 242°, sill 0.22 m ───┘
            3.60 m clear Ø · walkway 1.10 m around optic
```

- **Audio reference.** A glass lantern in a gale: RT60 0.35 s, bright 2–8 kHz glazing ring, the **Lamp Burner** as a 240–900 Hz vapour roar at −22 dBFS when lit and total absence when not, the roller race as a 0.07 Hz brass groan, and wind at −20 dBFS rising 6 dB per Storm Stage.

### 3.11 Gallery — +25.20 m, exterior

- **Purpose.** The only exterior, and the only place the player sees the whole system at once: the beam going out, the sea, Skerry Shoal and the *Ardmore*. **In the first slice.**
- **Theme.** A 1.15 m iron grating ring around the lantern, 25.2 m up, in 14–32 m/s of wind.
- **Mood.** Terrifying and clarifying. The game's emotional high point is standing here with the beam passing overhead.
- **Palette reference.** `#2E4650` Iron Blue sky, `#16262E` Slate Sea water, `#A8B4B0` Sea Foam crests and **Skerry Shoal** surf, `#5C6B6A` Weathered Zinc rail, `#FFF6E2` Optic White on the *Ardmore*'s masthead light.
- **Landmarks.** The 16.96 m **Gallery Rail** ring; the 0.22 m **Gallery Storm Sill** at the **Gallery Door**; the **Storm Pane** frames from outside, which is where a **Storm Board** gets fitted; **Skerry Shoal** at 1 480 m on bearing 128°; the *Ardmore* at 8 000 m closing at 4.92 m/s; the **Herring Gull** on the rail at Storm Stage ≤ 2.
- **Encounters.** *Ardmore* sighting (slice beat 4); Shattered Storm Pane acts 2–3 (fit the **Storm Board** with two **Board Clamp**s, 3.2 s each). Ambient: a 1.45× gust every 4.0–11.0 s by Storm Stage, and a spray sheet over the rail every 9–16 s at Storm Stage ≥ 4.
- **Mechanics it introduces.** Brace speed 1.40 m/s and the Hurry lockout; the 0.22 m sill as the game's only jump-or-step threshold; and the rule that a match will not strike out here at Storm Stage ≥ 4, which forces every relight back inside.
- **Expected playtime.** 2.0 min per Night.
- **Lighting key.** **Lamp Key** as a 1.10 s sweep overhead every 7.5 s — the player stands *under* the beam, not in it. **Storm Fill** at 0.15 lx ambient, 420 lx on a lightning flash, which is the only moment the player sees Skerry Shoal's full extent.
- **Layout sketch.**

```
                    242° wind ↓↓↓
          ╔═══════ Gallery Rail 1.05 m ═══════╗
          ║   ▭ Storm Pane frames (8, from outside)
          ║        ┌── lantern ──┐            ║
    128°  ║        │   ◎ optic   │            ║  116°
   Skerry ║        └─────────────┘            ║  → Ardmore
   Shoal  ║   ╫ Gallery Door + 0.22 m sill    ║    8 000 m
   1 480 m╚═══════════════════════════════════╝
           deck 1.15 m wide · ring 16.96 m · 10.7 m² walkable
```

- **Audio reference.** Exposed at height in a storm: wind at −8 dBFS with a 90–260 Hz rail howl, no reverb tail at all (the sudden loss of RT60 on stepping outside is the designed effect), surf on the **Rock Base** 25.2 m below at 8 s period, the *Ardmore*'s 148 Hz whistle arriving 23.5 s late at 8 000 m (from 340 m/s sound speed), and the **Herring Gull** at 1.8–3.4 kHz.

### 3.12 Service Stair — S1 to S7, 0.00 m to +25.20 m

- **Purpose.** The cost. 25.2 m of helical stair at 0.95 m/s ascending is the game's only currency and the reason each fault feels different from the last. Segment **S7** (+21.60 → +25.20 m) is **in the first slice**.
- **Theme.** One continuous tarred-oak helix inside a granite drum, with iron nosings and a rail worn bright by hands.
- **Mood.** Rhythmic and relentless. 18 risers, a landing, 18 risers, a landing.
- **Palette reference.** `#3A2A1E` Tarred Oak treads and rail, `#16262E` Slate Sea granite, `#5C6B6A` Weathered Zinc nosings, with an `#F2C879` Lamp Gold pulse washing down the well every 7.5 s when the lamp is lit.
- **Landmarks.** The rail's polished rub-through, continuous from S1 to S7 — the one uninterrupted trail in the game, and the only wayfinding the player is given; iron riser-count plates at every 6th riser; the 1.10 × 1.60 m **Stair Opening** at each slab, alternating 175° per floor so the player never emerges on the same side twice.
- **Encounters.** No scripted event ever fires while the player is on the stair. This is a hard rule: the stair is where the player thinks.
- **Mechanics it introduces.** Stair movement (0.95 m/s up, 1.25 m/s down), the Breath System's 18.0/s ascending drain and its 5.3 m Hurry ceiling (from 100 ÷ 18.0 /s × 0.95 m/s), and dropped-item slide at 1.8 m/s.
- **Expected playtime.** 4.0 min per Night, in roughly 16 traversals.
- **Lighting key.** **Storm Fill** at 0.15 lx with a 7.5 s **Lamp Key** pulse down the well at 0.9–6.5 lx depending on how many Stair Opening doors are open. With the lamp out and no **Keeper's Lantern**, the stair runs at 0.05 lx and is navigable only by the rail — which is exactly the intended experience of faults 4 and 5.
- **Layout sketch.**

```
   +25.20 ── Lamp Room     ╮ S7   1.65 m walk-line radius
   +21.60 ── Watch Room    ╯      18 risers × 0.20 m
   +18.00 ── Pipe Landing  ╮ S6   0.28 m going at walk line
   +14.40 ── Landing L5    ╯      0.90 m clear width
   +10.80 ── Landing L4    ╮ S5   175° sweep per floor
    +7.20 ── Store Room    ╯      6.20 m path length per floor
    +3.60 ── Workshop      ╮ S3–S4
     0.00 ── Keeper's Qtrs ╯ S1–S2
```

- **Audio reference.** A stone spiral stair: RT60 1.10 s with a pronounced 180–400 Hz tube resonance and a distinct flutter echo at 11 Hz off the treads, oak tread creak pitched 4 semitones lower at the bottom than the top, hand-on-rail slide, and footstep intervals of 0.58 s walking.

### 3.13 Conduit Crawl — +18.00 m

- **Purpose.** One 4.20 m crouch that turns the **Weight Shaft** from scenery into a place. It exists so that reading the **Drive Weight** costs something.
- **Theme.** A 1.10 × 0.80 m granite duct carrying the **Feed Line Run** and the **Rotation Drive**'s guide rope.
- **Mood.** Close, loud and briefly helpless — Hurry is disabled and the player's shoulders are 0.05 m from the walls (from 0.80 m clear − 0.70 m shoulder clearance).
- **Palette reference.** `#16262E` Slate Sea, `#0B1418` Deep Storm Black, one `#C2A15A` Brass union at 2.10 m in.
- **Landmarks.** The brass union at 2.10 m in, which is the halfway marker and the only thing to aim at; the shaft mouth at 4.20 m, opening onto the 18.0 m void.
- **Encounters.** Stalled Rotation observations 3 and 4; Dead Feed Line observation 3 (the oil smell is strongest here).
- **Mechanics it introduces.** Forced crouch plus forced Brace speed 1.40 m/s — 3.0 s each way (from 4.20 m ÷ 1.40 m/s).
- **Expected playtime.** Included in the **Pipe Landing** and **Weight Shaft** figures.
- **Lighting key.** **Hand Key** only, 0.03 lx without it. The **Keeper's Lantern** occupies the carry slot, so the player crawls in holding the lantern and crawls out holding the lantern, and must make a second trip for the tool — the single-slot rule's most expensive consequence, by design.
- **Layout sketch.**

```
  Pipe Landing ▭════════ 4.20 m ════════▭ Weight Shaft
   +18.00       1.10 m high × 0.80 m wide
                     ⊙ brass union @ 2.10 m
```

- **Audio reference.** A granite duct: RT60 0.25 s but with a hard 380 Hz standing wave along its length, cloth-on-stone foley, breathing at close mic distance, and the **Weight Shaft**'s 1.9 s tail audible only at the far mouth — the reverb changing as the player crawls is the cue that the shaft is ahead.

---

## 4. Beat chart — first playable slice

Authored for a **first-time player**, not for par. Slice Track runs 360 s; the **Wick Drain** fires at Slice Track 50.0 % (180 s). The par-play darkness for this fault is 48 s; the chart below budgets 92 s for a first-timer, costing 46 % Drift (from 0.50 %/s × 92 s) against a 100 % ceiling.

Intensity is 0 (nothing is happening) to 5 (peak of the whole game). The slice's ceiling is 4; 5 is reserved for the Dead Feed Line cycle in the full Night.

| # | Beat | Type | Intensity | Duration | Where | What happens |
|---|---|---|---|---|---|---|
| 1 | Cold Watch | explore | 1 | 50 s | Watch Room | Seated at the **Watch Desk**. Rain on the **Window Splay**. The **Lamp Key** crosses the ceiling every 7.5 s. Nothing is wrong and nothing is asked. |
| 2 | Climb to the Lamp | explore | 1 | 25 s | Service Stair S7 | First stair traversal, 3.6 m in 3.79 s, plus the player's own hesitation. The rail's rub-through is the only guidance. |
| 3 | Read the Machine | explore | 2 | 30 s | Lamp Room | **Fresnel Optic** at 4.0 rpm at arm's length. First Lean-in on the **Feed Pressure Gauge**: 1.6 bar. **Flame Height** 82 mm. Everything is correct, which teaches what correct looks like. |
| 4 | Ardmore Sighting | scripted | 2 | 35 s | Lamp Room → Watch Room | A single **Optic White** masthead light appears at 8 000 m on bearing 116°. The **Watch Telescope** resolves her. The **Bearing Board** takes a chalk mark. |
| 5 | Out on the Gallery | explore | 2 | 30 s | Gallery | Brace speed 1.40 m/s, 14 m/s wind, RT60 drops to zero on crossing the **Gallery Storm Sill**. The beam passes overhead. **Skerry Shoal** is visible at 1 480 m on the next lightning flash. The player understands the geometry of the problem without being told it. |
| 6 | The Hiss Changes | scripted | 3 | 10 s | Lamp Room | The **Lamp Burner**'s 240–900 Hz vapour roar detunes downward by 3 semitones and the flame flicker widens from ±3 mm at 2.1 Hz to ±11 mm at 3.4 Hz. Audio-only warning. Slice Track hits 50.0 %. |
| 7 | The Lamp Dies | scripted | 4 | 12 s | Lamp Room | **Flame Height** 82 → 31 mm over 6.0 s, holds 3.0 s, then 0 mm. Beam off. Room falls from 1 400 lx to 0.15 lx with 0.9 EV/s adaptation. Drift begins at 0.50 %/s. The storm bed is suddenly the loudest thing in the game. |
| 8 | Read the Gauges | puzzle | 3 | 26 s | Watch Room | Descend S7. Lean-in: **Oil Sight Glass** 34.0 L — supply is fine. Lean-in: **Feed Pressure Gauge** 0.2 bar — feed is not. Two readings, one conclusion, no text. |
| 9 | The Half-Shut Cock | puzzle | 2 | 16 s | Watch Room | The **Reservoir Cock** handle sits at 25° of 90°. Hold Interact 3.0 s. The gauge climbs 0.2 → 1.6 bar over 4.0 s and the **Feed Line Run** gurgles back to life. |
| 10 | Fetch the Trimmer | explore | 2 | 14 s | Watch Room | The **Watch Desk** drawer, 2.4 m away. The **Wick Trimmer** fills the single carry slot, which the player feels for the first time. |
| 11 | Trim and Light | puzzle | 4 | 24 s | Lamp Room | Climb S7. Three Interacts on the **Wick** at 1.6 s each, 4 mm → 12 mm. **Match Tin**, then **Lamp Burner**. 0 → 82 mm in 2.2 s. A player who skips the trim gets a 31 mm flame that dies in 8.0 s, and learns the rule the hard way with 40 % Drift still in hand. |
| 12 | The Beam Returns | scripted | 1 | 20 s | Lamp Room | The **Fresnel Optic** is lit from inside. The beam crosses the sea. Drift reverses to −0.60 %/s. Music enters for the first time in the slice. |
| 13 | Write the Log | explore | 1 | 32 s | Watch Room | The **Logbook** has written page 1, "Wick Drain", listing the observations the player actually made. Blank ruled lines where they guessed. |
| 14 | Second Flicker | scripted | 3 | 8 s | anywhere | **Flame Height** dips 82 → 64 mm and recovers over 8 s. No fault fires. The slice's last statement is a promise. |
| 15 | Hold the Watch | explore | 1 | 14 s | anywhere | Slice Track runs to 100.0 %. |
| 16 | Passing Abeam | scripted | 2 | 14 s | Gallery or Lamp Room | The *Ardmore* passes Skerry Shoal at 620 m and sounds one long 6.0 s blast. The sky lifts to 5 200 K. Win card. |

**Totals.** Beats 1–6: 180 s, matching the Slice Track's 50 % fire mark. Beats 7–11: 92 s of darkness. Beats 12–15: 74 s. Beat 16: 14 s outro. **Slice runtime 360 s of Slice Track plus a 14 s outro = 6.2 min**, inside the 6–8 min target with 1.8 min of headroom for player hesitation.

**Intensity curve.** 1 · 1 · 2 · 2 · 2 · 3 · **4** · 3 · 2 · 2 · **4** · 1 · 1 · 3 · 1 · 2 — a double peak at beats 7 and 11 with a deliberate trough at beats 9–10, so the fetch is the calm inside the emergency rather than another spike. The slice's full-game job is to establish the shape every later Fault Cycle repeats at a higher amplitude.
