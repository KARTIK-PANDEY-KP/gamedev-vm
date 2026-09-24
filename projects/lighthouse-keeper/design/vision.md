# CANDLEWICK LIGHT — Vision

**Archetype:** first-person diagnostic-repair game (immersive-sim-lite, no combat) · 3D · first-person, single camera, no third-person view anywhere in the product.

**Build target:** Unity 6 · Blender 5.2.2 · single-player, offline, no services.

---

## Logline

You are the sole keeper of Candlewick Light on the night of 21 October 1904, and the lamp will not stay burning. Five times before dawn something in the tower breaks; each time you must read the machine, find the fault, and get the beam back on the water before the coaster *Ardmore* is driven onto Skerry Shoal.

**X meets Y:** *Firewatch* meets *Hardspace: Shipbreaker* — the lonely, weather-beaten first-person place of the first, the hands-on diegetic machinery and hard timer of the second.

## Player fantasy

You are the one competent person in a hundred kilometres of black water, and the machine you tend is knowable. Nobody is coming to help, nothing is hunting you, and every problem in the tower has a physical cause you can find by looking, listening and climbing. The fantasy is *earned mastery of a specific machine under weather*, and the reward is a beam sweeping out over the sea because you personally put it there.

## Design pillars

1. **The Machine Is Knowable.** Every fault has one physical cause reachable by a chain of 3–5 diegetic observations, deterministic on every playthrough. *Excludes:* randomised faults, hidden-stat RNG, dice-roll repairs, unexplained fixes.
2. **Diegetic Everything.** Information lives on gauges, flame height, sound and the *Ardmore*'s own lights; the default HUD covers under 1.5 % of screen area. *Excludes:* objective markers, waypoints, minimap, quest log, floating names, damage numbers.
3. **Pressure Without Violence.** All tension comes from the Drift Meter, the 28.8 m climb and the storm. *Excludes:* combat, enemies, weapons, player health, player death, chases, jump scares.
4. **The Climb Is The Cost.** Vertical distance is the game's only real currency — 3.6 m per floor at 0.95 m/s ascending. *Excludes:* fast travel, teleports, elevators, infinite pockets (one carried item at a time).
5. **Quiet Is Loud.** The score is silent for 55–65 % of the runtime; a storm gust dropping out is a designed event. *Excludes:* wall-to-wall music, radio chatter, spoken exposition, tutorial voice.

## Core loop

**Moment to moment (2–20 s):** notice a symptom (flame collapses, a click stops, a gauge reads wrong) → move or climb toward the part of the machine it implicates → Lean-in to read a gauge, or Interact to open, turn, pump, wind, wipe or trim → the machine answers immediately in light and sound.

**Session — one Fault Cycle (150–240 s):** the lamp fails → you diagnose through 3–5 observations → you fetch the one tool or part that fault needs from the floor that holds it → you repair → you strike a match and relight → the beam returns and the Drift Meter starts falling. Par darkness per cycle is 48–132 s.

**Meta — the Night (25 min of Ardmore Track, 28–34 min wall clock):** five named Faults fire at fixed marks on the *Ardmore*'s 1 500 s approach — Wick Drain at 14 %, Clouded Optic at 30 %, Stalled Rotation at 48 %, Shattered Storm Pane at 66 %, Dead Feed Line at 84 %. Each repair adds one Logbook page and steps the Storm System up one stage. There is no unlockable gear and no carry-over between nights; what accumulates is your understanding of the tower and your unspent Drift margin.

## The first five minutes

You are sitting at the Watch Desk in the Watch Room, +21.6 m up the tower, and the only thing moving is rain on the window splay. Ahead of you the Oil Sight Glass on the Day Tank reads 34 L; above you, through the Stair Opening, a warm bar of light swings past every 7.5 seconds and paints the ceiling, then leaves. You stand up — 2.6 m/s, the floor plates ring — and the storm outside is loud enough that you can feel it in the granite.

You climb the Service Stair. Eighteen risers, 3.6 m, about four seconds, and you come up into the Lamp Room inside the Fresnel Optic's own glare. The lens assembly turns at 4.0 rpm on its clockwork; the flame at the Lamp Burner stands 82 mm high and hisses. You hold Lean-in and the view narrows to 38° so you can read the Feed Pressure Gauge: 1.6 bar. Everything is right. You look out through the lantern glazing, past your own reflection, and find the thing you have been listening for since midnight — a single white masthead light, low, 8 km out on a heading that will take it across Skerry Shoal.

You go back down and out onto the Gallery, into 14 m/s of wind, and your walk speed drops to 1.4 m/s as you brace on the rail. The beam passes over your head and you can follow it out across the water. You raise the Watch Telescope. She's a coaster, riding light, and she is holding the light — steering on you.

Behind you the hiss changes pitch.

You turn. Inside the lantern the flame has dropped from 82 mm to 31 mm and the beam going out over the sea has gone the colour of weak tea. Then it drops again, and the Lamp Room goes dark except for the storm, and out on the water the *Ardmore* stops being a ship steering on a light and becomes a ship steering on nothing.

Your first Fault Cycle begins here, with 48 seconds of par darkness and no instructions.

---

## THE FIRST PLAYABLE SLICE

**One area, one complete loop.** The slice is the top of the tower — **Watch Room** (+21.6 m), **Service Stair** segment **S7** (+21.6 → +25.2 m), **Lamp Room** (+25.2 m) and **Gallery** (+25.2 m, exterior) — plus the sea, sky, *Ardmore* and Skerry Shoal rendered at full distance. It runs the whole core loop end to end on one Fault: **Wick Drain**.

**Playable footprint:** 3 interior volumes totalling 34.7 m² of walkable floor (Watch Room 12.4 m², Lamp Room 11.6 m², Gallery deck ring 10.7 m²) plus one 6.20 m stair flight. Target slice length **6–8 minutes**.

### The complete core loop in the slice

| # | Step | Where | Player action | Machine response |
|---|---|---|---|---|
| 1 | Watch | Watch Room, Lamp Room, Gallery | free movement, Lean-in on any gauge | Fresnel Optic turns at 4.0 rpm, Fl W 7.5 s beam sweep |
| 2 | Sight the *Ardmore* | Gallery | raise Watch Telescope | ship resolves at 8 000 m, bearing 116° chalked on Bearing Board |
| 3 | Symptom | Lamp Room | none — scripted at Slice Track 50 % (180 s, from 360 s × 0.50) | flame 82 mm → 31 mm over 6 s, then 0 mm; beam off; Drift Meter starts rising at 0.50 %/s |
| 4 | Observation A | Watch Room | Lean-in on Oil Sight Glass | reads 34 L — supply is **not** the cause |
| 5 | Observation B | Watch Room | Lean-in on Feed Pressure Gauge | reads 0.2 bar — feed **is** the cause |
| 6 | Observation C | Watch Room | look at Reservoir Cock | handle at 25° of 90° travel — half shut |
| 7 | Repair act 1 | Watch Room | hold Interact 3.0 s on Reservoir Cock | handle to 90°, Feed Pressure Gauge climbs 0.2 → 1.6 bar over 4.0 s, gurgle in the Feed Line |
| 8 | Fetch | Watch Room | open Watch Desk drawer, take Wick Trimmer | Wick Trimmer enters hands; carry slot occupied |
| 9 | Repair act 2 | Lamp Room | 3 × Interact on Wick with Wick Trimmer held | charred crown removed in 3 snips, 1.6 s each; Wick length 4 mm → 12 mm |
| 10 | Relight | Lamp Room | Interact on Match Tin, then Interact on Lamp Burner | match strikes, flame 0 → 82 mm over 2.2 s, beam returns, Drift Meter reverses to −0.6 %/s |
| 11 | Logbook | Watch Room | read Logbook | page 1 "Wick Drain" written; slice runs to Slice Track 100 % |

### Slice win and lose conditions

- **Win — Passing Abeam:** Slice Track reaches 100 % (360 s) with Drift Meter < 100 %. The *Ardmore* passes Skerry Shoal at 620 m and sounds one long blast. 14 s outro.
- **Lose — Grounding:** Drift Meter reaches 100 % at any moment. 22 s scripted grounding: masthead light swings 40° to starboard, hull-on-rock sustain, whistle jams open. Lose card, Restart Night / Title.
- **Lose — Reservoir Dry:** Day Tank Oil Sight Glass reaches 0.0 L while the lamp is dark. Unrecoverable in the slice (no Oil Cellar); resolves to Grounding after 10 s.
- **Soft fail — Fall Injury:** a fall of more than 4.0 m into the Stair Opening costs 6.0 s of stagger and caps movement at 1.4 m/s for 20 s. The player never dies.

### Deferred out of the slice — explicit list

**Areas:** Oil Cellar (−3.6 m), Keeper's Quarters (0.0 m), Workshop (+3.6 m), Store Room (+7.2 m), Landing L4 (+10.8 m), Landing L5 (+14.4 m), Pipe Landing (+18.0 m), Weight Shaft (+7.2 → +25.2 m), Conduit Crawl, Service Stair segments S1–S6.
**Faults:** Clouded Optic, Stalled Rotation, Shattered Storm Pane, Dead Feed Line.
**Systems:** Rotation System (drives the optic on a fixed 4.0 rpm animation in the slice, no winding), Oil System bulk side (Oil Reservoir, Oil Pump, Feed Hose), Breath System and Hurry (walk-only in the slice), Storm System stages 2–5 (locked to stage 1: wind 14 m/s, rain 20 mm/h), Carry System beyond one small hand prop (no Storm Board, no Oil Can).
**Content:** full 1 500 s Ardmore Track, Logbook pages 2–5, Herring Gull, Title/Settings/Credits screens beyond a two-item placeholder, save/continue, Storm Board and Board Clamp, Winding Crank, Optic Cloth, all Storm Pane damage states, Accessibility Assist HUD beyond the Drift readout.

### Acceptance checks for the slice

Each is a statement about the running build that a tester can mark pass or fail.

**Movement and camera**
1. Walking on level plate reaches 2.6 m/s ±0.1 m/s within 0.19 s of input (from acceleration 14 m/s²) and stops within 0.13 s of release (deceleration 20 m/s²).
2. Ascending Service Stair segment S7 from Watch Room floor to Lamp Room floor takes 3.6–4.0 s; descending takes 2.7–3.1 s.
3. Stepping onto the Gallery through the Gallery Storm Sill reduces max speed to 1.4 m/s ±0.1 m/s within 0.5 s and restores 2.6 m/s within 0.5 s of stepping back inside.
4. Default vertical FOV is 55.0°; Lean-in reaches 38.0° in 0.22 s and returns in 0.18 s; pitch clamps at ±88.0°.
5. A 0.45 m step-up is clearable with Jump and a 0.28 m step-up is clearable without it; no surface in the slice requires a jump to reach a required interactable.
6. No third-person camera, no reflection of the player body other than the baked lantern-glazing ghost, and no camera cut occurs anywhere in the slice.

**Watch phase (loop steps 1–2)**
7. The Fresnel Optic completes one revolution in 15.0 s ±0.1 s and the beam crosses the Gallery observer position once every 7.5 s ±0.1 s.
8. Lean-in on the Oil Sight Glass, Feed Pressure Gauge and Bearing Board each produces a legible reading at 1080p without zoom assistance from 0.6 m.
9. The *Ardmore* is visible unaided as a single white masthead light at 8 000 m and resolves to a hull silhouette through the Watch Telescope, with no popping LOD transition inside 2 000–10 000 m.
10. The Watch Telescope raises in 0.6 s, applies 6.0× magnification (vertical FOV 55.0° → 9.2°), and cannot be raised while the Wick Trimmer is held.

**Symptom (loop step 3)**
11. At Slice Track 50.0 % ±0.2 % (180 s) the Wick Drain fires: Flame Height animates 82 mm → 31 mm over 6.0 s, holds 3.0 s, then reaches 0 mm.
12. Within 0.5 s of Flame Height reaching 0 mm the beam stops casting, the Lamp Room falls to its unlit key (0.15 lx from storm sky), and the Drift Meter begins rising at 0.50 %/s.
13. The Drift Meter's rate is 0.00 %/s while Flame Height ≥ 60 mm, −0.60 %/s while Flame Height ≥ 60 mm and Drift > 0 %, and clamps at 0.0 % and 100.0 %.

**Diagnosis (loop steps 4–6)**
14. The Oil Sight Glass reads 34.0 L ±0.5 L at fault onset and falls no faster than 0.02 L/s while the lamp is lit.
15. The Feed Pressure Gauge reads 0.2 bar ±0.05 bar at fault onset and 1.6 bar ±0.05 bar after the Reservoir Cock is fully open.
16. The Reservoir Cock handle renders at 25° of its 90° travel at fault onset, and its angle is readable from 2.0 m without Lean-in.
17. Relighting the Lamp Burner while Feed Pressure Gauge < 1.0 bar produces a flame that reaches 31 mm maximum and self-extinguishes within 8.0 s — a wrong fix fails legibly rather than silently.

**Repair and relight (loop steps 7–10)**
18. Holding Interact on the Reservoir Cock for 3.0 s completes the turn; releasing before 3.0 s returns the handle to 25° within 0.4 s and no partial credit is stored.
19. The Watch Desk drawer opens in 0.45 s and the Wick Trimmer can be taken from it in one Interact; taking it while hands are full is refused with an audible refusal cue and no animation.
20. Three Interacts on the Wick with the Wick Trimmer held, at 1.6 s each, raise Wick length from 4 mm to 12 mm; fewer than three leave the wick short and step 17's failure applies.
21. Interact on the Match Tin then on the Lamp Burner brings Flame Height 0 → 82 mm in 2.2 s ±0.2 s, restores the beam within 0.3 s of crossing 60 mm, and the whole relight is possible with one hand slot occupied by the Wick Trimmer.
22. Completing the repair writes Logbook page 1 titled "Wick Drain" with the three observations the player actually made, and the Logbook is readable in 0.3 s from the Tab / D-pad-Down input without pausing the Ardmore Track.

**Win and lose**
23. Reaching Slice Track 100.0 % with Drift Meter < 100.0 % plays the 14 s Passing Abeam outro with the *Ardmore* abeam at 620 m ±20 m and one long blast, then shows the win card.
24. Driving the Drift Meter to 100.0 % — by leaving the lamp dark for 200 s from a 0 % start (from 100 % ÷ 0.50 %/s) — plays the 22 s Grounding sequence and shows the lose card, from any player position in the slice including inside the Watch Room with no view of the sea.
25. Draining the Day Tank to 0.0 L while dark shows the Grounding sequence after 10.0 s and never leaves the player in an unwinnable state without feedback.
26. Restart Night from either card returns the player to the Watch Desk with Slice Track 0.0 %, Drift 0.0 %, Oil Sight Glass 34.0 L, Feed Pressure Gauge 1.6 bar, Flame Height 82 mm and the Wick Trimmer back in the drawer, in under 4.0 s of load.
27. Pause is reachable in under 0.2 s from any state including the Grounding sequence, and freezes the Ardmore Track, Drift Meter, Flame Height and Fresnel Optic rotation within 1 frame.

**Performance and integrity**
28. The slice holds 60 fps at 1280×800 on the Steam Deck reference and at 2560×1440 on the PC reference, with on-screen triangles ≤ 1.8 M and draw calls ≤ 900.
29. No element of the slice reads text, plays speech or shows an icon that is not either a diegetic object in the world or one of the three permitted HUD elements (interaction dot, interaction prompt, optional Assist HUD).
30. A tester who has never seen the game completes the Wick Drain cycle with no external instruction in under 150 s on at least 7 of 10 attempts.

---

## Assumptions

Ordered by the number of documents that depend on each. Nothing below was stated in the original idea.

| # | Assumption | Why | Depended on by |
|---|---|---|---|
| A1 | **Archetype is first-person 3D diagnostic-repair with no combat and no player death.** "Tense, quiet, no combat" plus "find what broke, and fix it" only resolves into a verb set if repair is the whole mechanical vocabulary. | Fixes the 3Cs, the verb table, the entity roster and everything in the art and audio pillars. | vision, game-design, art-bible, level-design, audio |
| A2 | **Core loop is five deterministic Fault Cycles on one 1 500 s Ardmore Track, with a persistent Drift Meter 0–100 %.** "The lamp keeps failing" implies repetition; a single carried-over meter makes repetition escalate without new systems. | Gives the game a length, a difficulty curve, a win state and a lose state. | vision, game-design, level-design, audio |
| A3 | **Setting is Candlewick Light on Candlewick Point, night of 21 October 1904, North Atlantic; oil-vapour lamp and clockwork rotation, no electricity.** A pre-electric light station makes every subsystem mechanical and therefore inspectable by hand, which is what pillar 1 needs. | Determines every asset, every material, the palette, the whole audio bed. | vision, game-design, art-bible, level-design, audio |
| A4 | **Tower geometry: 7 floors at 3.6 m floor-to-floor, Lamp Room at +25.2 m, Oil Cellar at −3.6 m, internal clear diameter 4.20 m.** The idea requires a climb that costs something; 28.8 m of vertical at 0.95 m/s gives a 30.3 s traverse, which is long enough to hurt and short enough to repeat 5 times. | All metrics, all area layouts, all movement tuning, all reverb zones. | vision, game-design, art-bible, level-design, audio |
| A5 | **The ship is the coaster *Ardmore*, 8 000 m out at fault 1, and the hazard is Skerry Shoal.** "The ship on the horizon" needs one name and one distance to be referred to consistently. | The win condition, the telescope, the distant LOD, the whistle cues. | vision, game-design, art-bible, level-design, audio |
| A6 | **The five Faults are Wick Drain, Clouded Optic, Stalled Rotation, Shattered Storm Pane, Dead Feed Line.** Five distinct physical failure modes of a real oil light, each implicating a different floor, so the climb is never the same climb twice. | The systems doc, every area's purpose, the beat chart, the SFX list. | vision, game-design, level-design, audio |
| A7 | **Character of the light is Fl W 7.5 s — Fresnel Optic at 4.0 rpm with 2 panels.** A 7.5 s flash interval is slow enough to read as a rhythm and to be conspicuously *absent*. | Lighting keys, the rotation system, the music tempo relationship. | vision, game-design, art-bible, audio |
| A8 | **First slice is the top three floors and the Wick Drain fault only, 6–8 minutes.** The cheapest complete vertical slice that still contains a symptom, a diagnosis, a fetch, a repair, a relight, a win and a lose. | The slice section, the deferred list, the acceptance checks, the beat chart. | vision, game-design, level-design |
| A9 | **Player is Keeper Iona Rekk, Principal Keeper, alone because Assistant Keeper Dòmhnall Blair is ashore after the relief boat failed on 19 October 1904.** Explains solitude without a cutscene or a voice actor. | Worldbuilding answers, the Logbook's voice, the Keeper's Quarters dressing. | vision, level-design |
| A10 | **Platform target is PC (Windows/Linux) plus Steam Deck, 1280×800 at 60 fps on Deck and 2560×1440 at 60 fps on the PC reference.** Sets a hard, checkable budget for a small team. | Polygon and texture budgets, the asset table, the performance checks. | vision, art-bible |
| A11 | **Slice uses a shortened 360 s Slice Track with the Wick Drain firing at 50 % (180 s).** The full 1 500 s track would make the slice a 25-minute test; 180 s of watch before the fault is the minimum that establishes what a working lamp looks and sounds like. | The slice acceptance checks and the beat chart. | vision, level-design |
| A12 | **No player death; the only failure is the *Ardmore* grounding, and a fall costs 6.0 s of stagger plus 20 s at 1.4 m/s.** Death would convert the tension from duty into threat and break pillar 3. | Lose conditions, the game flow, the fall SFX. | vision, game-design, audio |
| A13 | **One carry slot for one hand prop; tools live on the floor that owns them.** Makes the climb the cost rather than inventory management. | The carry system, the verb table, the tool placement in every area. | vision, game-design, level-design |
| A14 | **Realism rating 7/10 — physically-plausible late-Victorian industrial materials, slightly heightened light and colour.** Photoreal would exceed what an image-generation asset pipeline can hold consistent across 48 assets; cartoon would undercut the weather. | The locked style prompt, the palette, the material rules. | vision, art-bible |
| A15 | **Score is 64 BPM, 4/4 (bar = 3.750 s), solo-cello-led, silent for 55–65 % of runtime.** Pillar 5 needs a number to be testable, and 64 BPM puts the Fl W 7.5 s flash exactly on every second bar line, so the lamp is the metronome. | The music state machine and its transition rules. | vision, audio |

## Non-goals

- No multiplayer, co-op, leaderboards, cloud saves, telemetry or any online service.
- No combat, weapons, enemies, stealth, health bar, or player death.
- No dialogue trees, spoken dialogue, voice-over narration, or on-screen subtitled speech; the Logbook is the only text the game writes.
- No inventory screen, crafting, skill tree, currency, shop, loot, or unlockable equipment.
- No procedural generation; the tower, the faults and the *Ardmore* Track are identical on every run.
- No motion-captured animation and no licensed IP, music or trademarked lighthouse-authority branding.
- No third-person camera, photo mode, cinematic cutaway, or scripted camera takeover.
- No open world, no second location, no daytime level, no sequel hooks.
- No mobile, console or VR port in this scope.

## Document index

| Document | Owner | Contains |
|---|---|---|
| `design/vision.md` | design lead | this file — archetype, pillars, core loop, first slice, acceptance checks, assumptions, non-goals |
| `design/game-design.md` | engineering | 3Cs with values, input map, verbs × objects, all eight systems with tuning knobs and edge cases, entity roster, objectives, win/lose, game flow, progression numbers, HUD and menus |
| `design/art-bible.md` | art | realism rating, the LOCKED STYLE PROMPT, palette hex values, shape/material/lighting rules, do-and-don't, platform budgets, the 48-row asset table |
| `design/level-design.md` | level | setting and worldbuilding answers, the metrics table, all twelve areas in full, the first-slice beat chart |
| `design/audio.md` | audio | audio pillars, music per area and per game state with transition rules, one sound effect per gameplay event, mix targets |
