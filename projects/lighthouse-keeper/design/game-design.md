# CANDLEWICK LIGHT — Game Design

Systems document. Companion to `design/vision.md`. All names used here are the canonical names and are used unchanged in `design/art-bible.md`, `design/level-design.md` and `design/audio.md`.

Target: Unity 6, single-player, offline. All values are authored values, not runtime-derived defaults.

---

## 1. The 3Cs

### 1.1 Character — Keeper Iona Rekk

| Property | Value | Note |
|---|---|---|
| Capsule height | 1.80 m | standing |
| Capsule radius | 0.30 m | |
| Eye height | 1.68 m | camera pivot |
| Crouch capsule height | 1.20 m | eye height 1.05 m |
| Mass | 74 kg | used only for pushed props |
| Walk speed | 2.60 m/s | ground, level plate |
| Hurry speed | 4.20 m/s | hold Hurry, gated by Breath System |
| Brace speed | 1.40 m/s | forced on Gallery and in Conduit Crawl |
| Crouch speed | 1.10 m/s | |
| Stair speed, ascending | 1.63 m/s along slope = **0.95 m/s vertical** (from 35.5° stair pitch: 0.95 = 1.63 × sin 35.5°) | 3.79 s per 3.6 m floor |
| Stair speed, descending | 2.15 m/s along slope = **1.25 m/s vertical** | 2.88 s per 3.6 m floor |
| Cellar Ladder speed | 0.75 m/s vertical up, 1.00 m/s vertical down | 4.80 s / 3.60 s for the 3.6 m rung run |
| Stair ascent while carrying the Storm Board | 0.62 m/s vertical | 18.0 m Store Room → Lamp Room becomes 29.0 s instead of 18.9 s |
| Ground acceleration | 14.0 m/s² | reaches walk speed in 0.19 s |
| Ground deceleration | 20.0 m/s² | stops from walk in 0.13 s |
| Air acceleration | 2.0 m/s² | |
| Gravity | 20.0 m/s² | non-physical, chosen for a 0.42 s jump |
| Jump apex height | 0.45 m | initial vertical velocity 4.24 m/s (from v = √(2 × 20.0 × 0.45)) |
| Jump airtime | 0.42 s | rise 0.21 s, fall 0.21 s |
| Max jumped gap | 1.09 m (from 0.42 s airtime × 2.60 m/s); **designed maximum 0.80 m** | 0.29 m safety margin |
| Step offset | 0.28 m | no stair or threshold in the game needs a jump |
| Slope limit | 42° | |
| Terminal velocity | 22.0 m/s | |
| Fall Injury threshold | 4.00 m | see Breath System edge cases |
| Head bob | 0.018 m amplitude at 1.90 Hz walking, 0.026 m at 2.70 Hz hurrying, 0.008 m at 1.10 Hz bracing | disable-able |
| Footstep interval | 0.58 s walking, 0.36 s hurrying (from stride length 1.51 m ÷ speed) | |

No health, no stamina bar, no damage, no death. The only persistent character state is Breath (0–100) and the carry slot.

### 1.2 Camera

| Property | Value |
|---|---|
| Type | first-person, rigid to the capsule, **boom distance 0.00 m** |
| Vertical FOV, default | 55.0° (horizontal 85.6° at 16:9, from 2 × atan(tan(27.5°) × 16/9)) |
| Vertical FOV, Lean-in | 38.0°, blend in 0.22 s ease-out, out 0.18 s ease-in |
| Vertical FOV, Watch Telescope | 9.2° (6.0× magnification of 55.0°), blend 0.60 s |
| Vertical FOV slider range | 48.0°–78.0° |
| Near plane / far plane, Near camera | 0.06 m / 200 m |
| Near plane / far plane, Far camera | 200 m / 12 000 m (renders sea, sky, Skerry Shoal, *Ardmore*) |
| Pitch clamp | −88.0° to +88.0° |
| Roll | 0.0° always, except 1.6° gust lean on the Gallery at Storm Stage ≥ 3 |
| Camera shake, thunder | 0.008 m translational, 0.25 s decay |
| Camera shake, gust on Gallery | 0.014 m translational at 0.7 Hz while wind ≥ 22 m/s |
| Motion blur | off by default, 0–100 % slider |
| Exposure | auto, 0.9 EV/s adaptation, range −2.0 to +12.0 EV |

### 1.3 Controls — full input map

| Action | Keyboard / mouse | Gamepad | Type |
|---|---|---|---|
| Move | W A S D | Left stick, dead zone 0.14 | analogue |
| Look | Mouse, default 0.125 °/count at 800 DPI (sensitivity slider 1–10, default 2.5) | Right stick, 120 °/s base ramping to 240 °/s at full deflection over 0.12 s, dead zone 0.12 | analogue |
| Hurry | Hold Left Shift | Hold L3 | hold |
| Jump | Space | A / South | press |
| Crouch | Hold Left Ctrl (toggle option) | B / East (toggle option) | hold or toggle |
| Interact | E | X / West | press |
| Interact, sustained (Reservoir Cock, Board Clamp) | Hold E | Hold X / West | hold |
| Pump (Oil Pump, Feed Hose) | Tap E at 1.6–2.4 Hz | Tap X / West at 1.6–2.4 Hz | rhythmic tap |
| Wind (Winding Crank) | Hold E, pace set by mouse wheel, target 1.4–1.8 rev/s | Hold X / West, pace set by Right trigger analogue, target 1.4–1.8 rev/s | hold + analogue |
| Grab-and-drag (Storm Board, Oil Drum) | Hold Right Mouse | Hold Left trigger | hold |
| Stow / Draw carried item | Q | Y / North | press |
| Lean-in | Hold F | Click Right stick | hold |
| Keeper's Lantern on/off | L | D-pad Up | press |
| Logbook | Tab | D-pad Down | press |
| Watch Telescope raise/lower | R | D-pad Right | press |
| Pause | Escape | Start / Menu | press |
| Skip outro | Any key, after 3.0 s | Any button, after 3.0 s | press |

Every binding is remappable. No action requires a chord. No action requires holding more than two inputs at once.

---

## 2. Verbs × objects

| Verb | Objects it applies to | Result |
|---|---|---|
| Walk / Hurry / Crouch | Service Stair, all floor slabs, Gallery deck, Conduit Crawl | position change; Gallery and Conduit Crawl force Brace speed 1.40 m/s |
| Jump | Gallery Storm Sill (0.22 m), Weight Shaft conduit lip (0.45 m) | clears the lip; never required, always faster than the walk-around by 1.8–3.1 s |
| Lean-in | Oil Sight Glass, Feed Pressure Gauge, Bearing Board, Rotation Tell-tale, Drive Weight, Storm Pane, Wick, Logbook | FOV 55.0° → 38.0°, movement capped 1.10 m/s, gauge becomes legible from 0.60–1.20 m |
| Interact | Reservoir Cock, Oil Pump, Winding Crank, Match Tin, Lamp Burner, Watch Desk drawer, Tool Rack, all doors and hatches, Board Clamp | the object's own action, listed per system below |
| Take | Wick Trimmer, Optic Cloth, Oil Can, Feed Hose, Winding Crank, Storm Board, Board Clamp, Keeper's Lantern, Watch Telescope | fills the single carry slot; refused with a cue if already full |
| Place | Storm Board → Storm Pane frame; Feed Hose → Feed Line couplings; Oil Can → Day Tank filler | snaps within 0.35 m and 25° of the socket; 0.8 s animation |
| Trim | Wick | 3 Interacts × 1.6 s; Wick length 4 mm → 12 mm |
| Wipe | Fresnel Optic panel (2 panels), Storm Pane (8 panes) | one panel per 2.4 s hold; Soot 100 % → 0 % on that panel |
| Prime | Oil Pump | 0.4 L cost, 2.2 s; Oil Pump enters Primed state |
| Pump | Oil Pump, Feed Hose | transfers 0.22 L/s at 2.0 Hz tap cadence; off-cadence taps transfer 0.06 L/s |
| Wind | Winding Crank on Rotation Drive | raises Drive Weight 0.42 m per revolution; 1.4–1.8 rev/s in-cadence, 0.5 rev/s off-cadence |
| Light | Lamp Burner (requires Match Tin struck within the last 6.0 s) | Flame Height 0 → 82 mm over 2.2 s if Feed Pressure ≥ 1.0 bar and Wick ≥ 10 mm |
| Open / Close | Reservoir Cock, 6 interior doors, Gallery Door, Oil Cellar hatch, Watch Desk drawer, Store Shelf | state toggle, 0.45–1.20 s |
| Read | Logbook, Bearing Board | opens a 2-page diegetic spread; the Ardmore Track keeps running |
| Toggle Lantern | Keeper's Lantern | 2.4 m radius, 38 lx at 1 m, 2 700 K; consumes nothing |
| Look through | Watch Telescope | 6.0× magnification; cannot be raised with any other item in the carry slot |

Verbs that do **not** exist: attack, throw, shoot, aim, block, dodge, sprint-slide, climb-ledge, swim, craft, equip, buy.

---

## 3. Systems

### 3.1 Lamp System

**Rules.** The Lamp Burner has a Flame Height of 0–90 mm. The beam is cast only when Flame Height ≥ 60 mm. Beam intensity scales linearly from 0 % at 60 mm to 100 % at 82 mm and is clipped above 82 mm. Lighting requires, simultaneously: Feed Pressure ≥ 1.00 bar, Wick length ≥ 10 mm, Day Tank ≥ 0.80 L, and a Match Tin strike within the last 6.0 s.

**States.** `Unlit` → `Striking` (0.6 s) → `Catching` (2.2 s, 0 → 82 mm) → `Burning` (82 mm nominal) → `Guttering` (falling, fault-driven) → `Unlit`.

**Tuning knobs.**

| Knob | Value |
|---|---|
| Nominal Flame Height | 82 mm |
| Beam cut-in / full | 60 mm / 82 mm |
| Catching duration | 2.2 s |
| Match strike window | 6.0 s |
| Guttering rate, Wick Drain | 8.5 mm/s for 6.0 s, 3.0 s hold at 31 mm, then 10.3 mm/s to 0 mm |
| Guttering rate, Shattered Storm Pane | 41.0 mm/s (2.0 s to snuff) |
| Flame flicker | ±3 mm at 2.1 Hz normally, ±11 mm at 3.4 Hz when Feed Pressure < 1.30 bar |
| Beam luminous range | 18 000 m nominal; visible to the *Ardmore* at 8 000 m |
| Underfed maximum | 31 mm, self-extinguishes after 8.0 s |

**Edge cases.** Striking a match on the Gallery at wind ≥ 22 m/s fails 100 % of the time with a distinct cue. Two strikes inside 1.0 s consume only one match-tin charge (the tin is infinite; the cooldown is 1.0 s). Relighting while Feed Pressure is 1.00–1.29 bar gives a 31 mm flame that lights the Lamp Room but never the beam — the player sees light and still loses Drift, which is the intended trap for a careless fix. Lighting with Day Tank between 0.80 L and 0.00 L burns for 190 s (from 0.80 L ÷ 0.0042 L/s) then guts.

### 3.2 Oil System

**Rules.** Bulk oil sits in the Oil Reservoir in the Oil Cellar (−3.6 m). The Oil Pump lifts it up the Feed Line Run riser to the Day Tank in the Watch Room (+21.6 m). The Reservoir Cock, also in the Watch Room, gates the Day Tank's outlet. Downstream of the cock the Feed Line drops 3.6 m to the settling trap and manifold on the Pipe Landing (+18.0 m), then rises 7.2 m to the Lamp Burner (+25.2 m) — 36.0 m of line in total. Feed Pressure is measured downstream of the Reservoir Cock and is a function of cock angle, Day Tank level and Feed Line integrity.

The **Dead Feed Line** fault splits the manifold union on the Pipe Landing, which is downstream of the cock, so the Day Tank drains through it at 0.35 L/s until the Reservoir Cock is shut. The repair is a **Feed Hose** coupled across the split union, followed by an air purge worked at the Oil Pump in the Oil Cellar — the only device in the tower that can push oil — after which the trap re-seats and the bypass holds 1.45 bar without further pumping. That is why the last fault costs a 28.8 m descent and a 28.8 m climb.

**States.** Oil Pump: `Dry` → `Primed` → `Pumping` → `Primed` → (25 s idle) → `Dry`. Feed Line: `Sound` → `Cracked` (Dead Feed Line fault) → `Bypassed`. Reservoir Cock: continuous 0–90°.

**Tuning knobs.**

| Knob | Value |
|---|---|
| Day Tank capacity / start | 40.0 L / 34.0 L |
| Oil Reservoir capacity / start | 240 L / 186 L |
| Burn rate, lamp lit | 0.0042 L/s (15.1 L/h) |
| Burn rate, lamp unlit | 0.0000 L/s |
| Feed Pressure at Cock 90°, Day Tank ≥ 4.0 L, line Sound | 1.60 bar |
| Feed Pressure at Cock 25° | 0.20 bar (linear 0.008 bar/° from 0°) |
| Feed Pressure with line Cracked | 0.35 bar regardless of cock |
| Feed Pressure with line Bypassed and purged | 1.45 bar, held indefinitely |
| Air purge at the Oil Pump after coupling the Feed Hose | 18.0 s of in-cadence pumping (4.0 L at 0.22 L/s) |
| Oil Pump transfer rate | 0.22 L/s at 1.6–2.4 Hz tap; 0.06 L/s off-cadence |
| Oil Pump prime cost / duration | 0.40 L / 2.2 s |
| Oil Pump loses prime after | 25.0 s of no pumping |
| Cracked Feed Line leak rate | 0.35 L/s until the Reservoir Cock is shut |
| Oil Can capacity | 4.0 L; spills 0.80 L/s while Hurry is held |
| Day Tank low cue | 4.0 L (Oil Sight Glass float turns Oxide Red) |
| Lamp lockout | Day Tank < 0.80 L |
| Full Day Tank refill from Oil Reservoir | 27.3 s of pumping (from 6.0 L deficit ÷ 0.22 L/s) |

**Derived night budget.** At par, one Night burns 6.3 L (from 0.0042 L/s × 1 500 s) plus 7.7 L lost to the Dead Feed Line (from 0.35 L/s × the 22 s par response before the Reservoir Cock is shut) = **14.0 L of 34.0 L**. A player who never shuts the cock runs the Day Tank dry in 79 s (from (34.0 − 6.3) L ÷ 0.35 L/s).

**Edge cases.** Pumping with the Day Tank at 40.0 L overflows onto the Watch Room floor at 0.22 L/s with no benefit and a loud, unambiguous cue. Shutting the Reservoir Cock while the lamp is Burning guts the flame in 11.4 s (from 82 mm ÷ 7.2 mm/s pressure-starvation rate). Carrying the Oil Can up the Service Stair while holding Hurry is the only way to lose oil without a fault; it is legible because oil visibly runs down the treads.

### 3.3 Rotation System

**Rules.** The Fresnel Optic is driven by the clockwork Rotation Drive, powered by the Drive Weight falling 18.0 m down the Weight Shaft (from Store Room +7.2 m to Lamp Room +25.2 m of shaft height). The optic turns at 4.0 rpm with 2 panels, producing **Fl W 7.5 s** — one white flash every 7.5 s (from 60 s ÷ 4.0 rpm ÷ 2 panels).

**States.** `Wound` (Drive Weight 14.0–18.0 m above floor) → `Running` → `Low` (2.0–4.0 m) → `Bottomed` (0.0–2.0 m, optic stalls) → `Wound`.

**Tuning knobs.**

| Knob | Value |
|---|---|
| Optic rotation | 4.0 rpm (15.0 s per revolution) |
| Flash interval | 7.5 s |
| Flash duration at the *Ardmore* | 1.10 s of usable arc |
| Drive Weight drop travel | 18.0 m |
| Drive Weight descent rate | 0.0075 m/s (2 400 s of run from full, from 18.0 m ÷ 0.0075 m/s) |
| Rotation Tell-tale click | 1 click per 3.75 s (half-revolution) |
| Winding Crank lift | 0.42 m of weight per crank revolution |
| Winding rate, in cadence | 1.4–1.8 rev/s = 0.59–0.76 m/s of weight |
| Full rewind from Bottomed | 26.5 s (from 18.0 m ÷ 0.68 m/s mean in-cadence rate) |
| Stall threshold | Drive Weight < 2.0 m |
| Coast-down on stall | optic decelerates 4.0 → 0.0 rpm over 5.5 s |

**Edge cases.** A stalled optic still passes light — the beam becomes a fixed sector rather than a flash, which the *Ardmore* cannot identify, so Drift rises at the fault rate even though the Lamp Room is bright. This is the Stalled Rotation fault's whole design and must be taught by the beat chart, not text. Winding past 18.0 m is hard-stopped with a mechanical clack; over-winding is impossible. Winding off-cadence still works at 0.5 rev/s, so the mechanic cannot lock a player out, only cost them 36 s extra (from 18.0 m ÷ 0.21 m/s − 26.5 s).

### 3.4 Storm System

**Rules.** The storm advances one Stage per Fault fired and never recedes. Stage drives wind speed, rain rate, gust period, thunder interval, wave audio and the Gallery's effect on the player.

| Stage | Fires at | Wind | Rain | Gust period | Thunder interval | Gallery effect | Sea state |
|---|---|---|---|---|---|---|---|
| 1 | Night start | 14 m/s | 20 mm/h | 11.0 s | 95 s | Brace 1.40 m/s | 2.4 m swell |
| 2 | Wick Drain repaired | 19 m/s | 38 mm/h | 8.5 s | 70 s | Brace + 1.6° camera roll | 3.1 m |
| 3 | Clouded Optic repaired | 24 m/s | 55 mm/h | 6.5 s | 52 s | + gust shake 0.014 m at 0.7 Hz | 4.0 m |
| 4 | Stalled Rotation repaired | 28 m/s | 74 mm/h | 5.0 s | 38 s | + match strike fails 100 % | 5.2 m |
| 5 | Shattered Storm Pane repaired | 32 m/s | 95 mm/h | 4.0 s | 26 s | + Gallery Door needs 1.6 s hold to open | 6.5 m |

**Tuning knobs.** Gust magnitude 1.45× base wind, 1.2 s attack, 2.1 s decay. Rain particle density scales linearly with rain rate, capped at 14 000 particles on screen. Lightning flash: 1 in 3 thunder events is preceded by a 0.12 s sky flash at 8× ambient, 1.4–4.0 s before the thunder (from 340 m/s sound speed over 480–1 360 m).

**Edge cases.** Stage 4 and 5 make match strikes on the Gallery impossible; every fault that requires a Gallery action (Shattered Storm Pane) is therefore structured so the relight happens inside the Lamp Room. A gust landing during a Winding Crank action does not break cadence — the storm never invalidates an in-progress repair, only travel.

### 3.5 Drift System — the timer

**Rules.** Two values run the Night. **Ardmore Track** advances 0.0667 %/s from 0 % to 100 % over 1 500 s and is never paused by gameplay (only by Pause). **Drift Meter** is 0–100 %; it rises while the light is not being *read* by the *Ardmore* and falls while it is. The light is being read when Flame Height ≥ 60 mm **and** the Fresnel Optic is turning at ≥ 3.6 rpm **and** at least one Fresnel Optic panel is below 40 % Soot **and** no more than 2 of the 8 Storm Panes are broken.

| Fault | Fires at Ardmore Track | Drift rate while unread | Par darkness | Drift cost at par |
|---|---|---|---|---|
| Wick Drain | 14.0 % (210 s) | 0.50 %/s | 48 s | 24 % |
| Clouded Optic | 30.0 % (450 s) | 0.55 %/s | 66 s | 36 % |
| Stalled Rotation | 48.0 % (720 s) | 0.60 %/s | 84 s | 50 % |
| Shattered Storm Pane | 66.0 % (990 s) | 0.65 %/s | 96 s | 62 % |
| Dead Feed Line | 84.0 % (1 260 s) | 0.68 %/s | 132 s | 90 % |

Recovery while read: **−0.60 %/s**, clamped at 0.0 %. Drift does **not** reset between faults; it is only ever driven down by a working light.

**Derived curve at par.** Drift peaks at the end of each Fault Cycle and returns to 0 % during each Watch Interval, except the last: the Watch Interval after Shattered Storm Pane is 174 s long (from (84.0 − 66.0) % ÷ 0.0667 %/s − 96 s) and recovers 104 %, clamping to 0 %, so a par player enters Dead Feed Line at 0 % and peaks at **90 %** — a 15 s margin (from (100 − 90) % ÷ 0.68 %/s).

**States.** `Read` (falling) → `Unread` (rising) → `Warned` (≥ 85 %: the *Ardmore* sounds five short blasts every 20 s) → `Breaking` (≥ 95 %: Skerry Shoal surf audible from every interior) → `Grounded` (100 %).

**Edge cases.** A lit-but-stalled optic, a lit-but-sooted optic and a lit-but-unglazed lantern all count as `Unread`, so brightness alone never saves the player. Pause freezes both values within one frame. Drift never rises during the 22 s Grounding sequence or the 14 s Passing Abeam outro. If a fault is repaired *before* it fires (impossible by design, but reachable by a debug jump), the fault is skipped and the Ardmore Track is unaffected.

### 3.6 Carry System

**Rules.** Exactly one carry slot. Small props occupy it and render in the right hand. The Storm Board (14 kg) occupies the slot two-handed: it forces Brace speed 1.40 m/s on the level, caps Service Stair ascent at 0.62 m/s vertical, and blocks Jump, Lean-in and the Watch Telescope. The Oil Drum is the one object that is dragged rather than carried, at 1.40 m/s, and cannot go on the Service Stair at all — it never needs to leave the floor it is on.

| Knob | Value |
|---|---|
| Carry slots | 1 |
| Take duration | 0.55 s |
| Place duration | 0.80 s |
| Stow / Draw duration | 0.35 s each |
| Place snap tolerance | 0.35 m position, 25° rotation |
| Drag speed (Oil Drum) | 1.40 m/s |
| Storm Board carry speed | 1.40 m/s level, 0.62 m/s vertical on the Service Stair |
| Refusal cue when slot is full | 0.18 s haptic + a dry wooden knock, no animation |

**Edge cases.** Stowed items persist across the whole Night; nothing is ever lost or destroyed. Dropping an item on the Service Stair lets it slide down to the next landing at 1.8 m/s — annoying, recoverable, never fatal. The Watch Telescope and the Keeper's Lantern both occupy the carry slot, so the player cannot glass the horizon and light their own way at once; this is deliberate.

### 3.7 Breath System

**Rules.** Breath is 0–100, starts at 100. Hurry drains it; everything else recovers it. Breath has no HUD bar — it is communicated by breathing audio and a screen vignette.

| Knob | Value |
|---|---|
| Hurry drain, level ground | 12.0 /s |
| Hurry drain, ascending Service Stair | 18.0 /s |
| Recovery, standing or walking | 8.0 /s |
| Recovery, Lean-in held | 11.0 /s |
| Exhausted threshold | 0.0 — forces walk for 3.0 s, then allows Hurry again above 15.0 |
| Vignette | 0 % at Breath 60, ramping to 18 % at Breath 0 |
| Breathing audio | 3 loop layers crossfaded at Breath 70 / 40 / 15 |
| Max continuous Hurry, level | 8.3 s (from 100 ÷ 12.0 /s) |
| Max continuous Hurry, stairs | 5.6 s (from 100 ÷ 18.0 /s) = 5.3 m of climb |

**Edge cases.** Fall Injury sets Breath to 0, applies a 6.0 s stagger and caps speed at 1.40 m/s for 20.0 s; it is the only punitive state in the game and it cannot chain (a second fall inside the 20 s window re-applies only the stagger). Hurry is disabled entirely on the Gallery and in the Conduit Crawl. Breath is irrelevant to every repair action — no repair can be failed by being out of breath.

### 3.8 Interaction and Lean-in System

**Rules.** A sphere cast of radius 0.10 m along the camera forward vector, 2.20 m range, picks the nearest interactable by angular distance to screen centre. Interactables carry a verb, a noun and an availability predicate; unavailable ones show the prompt struck through.

| Knob | Value |
|---|---|
| Cast range | 2.20 m |
| Cast radius | 0.10 m |
| Prompt fade in / out | 0.18 s / 0.12 s |
| Prompt dwell before showing | 0.08 s (kills flicker when sweeping the view) |
| Interaction dot | 4 px diameter, appears only when a target is held |
| Sustained-hold cancel | releasing before completion reverts the object in 0.40 s, no partial credit |
| Lean-in movement cap | 1.10 m/s |
| Gauge legibility distance at 38° FOV | 0.60–1.20 m at 1080p |

**Edge cases.** Two interactables inside 0.25 m of each other (Match Tin sitting on the Watch Desk beside the drawer handle) are disambiguated by a 1.4× angular weighting toward the one the player last used. Interacting through the Storm Pane glazing is blocked by a dedicated no-interact layer. Prompts never appear during the Grounding sequence.

### 3.9 Logbook System

**Rules.** The Logbook records only what the player has personally observed. Each Fault writes one page on repair, and each page lists the observations the player actually performed (2–5 of them) in the order performed. Unobserved causes appear as blank ruled lines.

| Knob | Value |
|---|---|
| Pages | 5, one per Fault |
| Observations tracked per Fault | 3 (Wick Drain, Clouded Optic), 4 (Stalled Rotation, Shattered Storm Pane), 5 (Dead Feed Line) |
| Open / close time | 0.30 s |
| Does it pause the game | No — Ardmore Track and Drift Meter keep running |
| Text size | 22 px at 1080p, 28 px with Large Text on |

**Edge cases.** Repairing a fault by accident (turning the Reservoir Cock before reading either gauge) still writes the page, with 2 blank lines — the Logbook is a record, not a reward, and never blocks progress.

---

## 4. Entity roster

| Entity | Class | Dimensions | Key stats |
|---|---|---|---|
| Keeper Iona Rekk | player | 1.80 m × 0.60 m Ø capsule, eye 1.68 m | walk 2.60 m/s, Hurry 4.20 m/s, Breath 100, carry slots 1, no health |
| *Ardmore* | scripted actor | 58.0 m LOA × 9.2 m beam × 4.4 m draught | Track 0–100 % at 0.0667 %/s, range 8 000 m → 620 m abeam, closing 4.92 m/s (from 7 380 m ÷ 1 500 s), whistle 148 Hz |
| Fresnel Optic | machine | 1.85 m tall × 1.40 m Ø, 2 panels | 4.0 rpm, Fl W 7.5 s, Soot 0–100 % per panel, stall < 3.6 rpm |
| Lamp Burner | machine | 0.42 m tall × 0.26 m Ø | Flame Height 0–90 mm, nominal 82 mm, beam cut-in 60 mm |
| Wick | consumable part | 0.06 m Ø ring, 4–14 mm exposed | trim 3 × 1.6 s, 4 mm → 12 mm |
| Day Tank | machine | 0.70 m × 0.70 m × 0.90 m | 40.0 L capacity, 34.0 L start, Oil Sight Glass 0–40 L |
| Oil Reservoir | machine | 1.80 m × 0.90 m × 1.20 m | 240 L capacity, 186 L start |
| Oil Pump | machine | 1.10 m tall, 0.34 m lever throw | 0.22 L/s at 2.0 Hz, prime 0.40 L, loses prime in 25 s |
| Reservoir Cock | machine | 0.18 m handle | 0–90°, 0.008 bar/°, 3.0 s full turn |
| Feed Line | machine | 0.032 m Ø, 36.0 m run (25.2 m cellar riser + 3.6 m drop to the Pipe Landing trap + 7.2 m rise to the burner) | Sound / Cracked / Bypassed, leak 0.35 L/s, crack site at the Pipe Landing manifold union |
| Rotation Drive | machine | 0.90 m × 0.60 m × 0.55 m | 4.0 rpm output, 2 400 s run time, stall < 2.0 m weight height |
| Drive Weight | machine | 0.28 m Ø × 0.85 m, 190 kg | 18.0 m travel, descent 0.0075 m/s, wind 0.42 m/rev |
| Storm Pane | modular part | 1.10 m × 1.45 m × 0.012 m, 8 off | Intact / Cracked / Broken; 3+ Broken makes the light unreadable |
| Storm Board | prop | 1.20 m × 1.55 m × 0.040 m, 14 kg | carried two-handed at 1.40 m/s level and 0.62 m/s vertical, 2 Board Clamps to fit, 6.4 s total fit time |
| Herring Gull | ambient | 0.62 m length, 1.44 m wingspan | 1 instance, perches on Gallery Rail, flees at 3.0 m, no gameplay effect (out of slice) |
| Storm | system actor | global | 5 stages, wind 14 → 32 m/s, rain 20 → 95 mm/h |
| Skerry Shoal | landmark | 210 m × 90 m exposed rock, 3.2 m above datum | the lose-state location, 1 480 m from the tower on bearing 128° |

There are no other actors. Nothing in the game can harm the player.

---

## 5. Objectives, win and lose

**Standing objective, never written on screen:** keep the light readable to the *Ardmore* until she passes Skerry Shoal abeam.

**Win — Passing Abeam.** Ardmore Track reaches 100.0 % with Drift Meter < 100.0 %. The *Ardmore* passes at 620 m, sounds one long blast of 6.0 s, and the sky lifts to a 5 200 K pre-dawn over 14.0 s. Win card shows: Night survived, peak Drift %, oil used in litres, and the 5 Logbook page titles.

**Lose — Grounding.** Drift Meter reaches 100.0 %. 22.0 s scripted sequence: masthead light swings 40° to starboard over 4.0 s, hull-on-rock sustain enters at 6.0 s, the whistle jams open at 11.0 s and runs to the end. Lose card offers Restart Night and Title only.

**Lose — Reservoir Dry.** Day Tank < 0.80 L and Oil Reservoir < 0.80 L while the lamp is unlit. Resolves to Grounding after 10.0 s. In the first slice, where the Oil Cellar does not exist, Day Tank alone triggers it.

**No other failure exists.** There is no timer on individual repairs, no instant fail, no soft lock. Every state the player can reach has a path back to a burning lamp except Reservoir Dry, which is itself announced 4.0 L in advance by the Oil Sight Glass float turning Oxide Red.

---

## 6. Game flow

```
TITLE
 ├─ New Night ──────────────► LOADING (≤ 4.0 s) ──► PLAY
 ├─ Continue Night ─────────► LOADING ─────────────► PLAY (resumes at last Fault boundary)
 ├─ Settings ───────────────► SETTINGS ──► back to TITLE
 └─ Quit

PLAY  (Ardmore Track running, 1 500 s)
 ├─ Pause (Esc/Start, ≤ 0.2 s, freezes all systems in 1 frame)
 │    ├─ Resume ───────────► PLAY
 │    ├─ Settings ────────► SETTINGS ──► back to PAUSE
 │    ├─ Restart Night ───► LOADING ──► PLAY
 │    └─ Quit to Title ──► TITLE
 ├─ Drift 100 % ──────────► GROUNDING (22.0 s, skippable after 3.0 s) ──► LOSE CARD
 │                                                       ├─ Restart Night ──► PLAY
 │                                                       └─ Title ─────────► TITLE
 └─ Ardmore Track 100 % ──► PASSING ABEAM (14.0 s, skippable after 3.0 s) ──► WIN CARD
                                                         ├─ Logbook (read all 5 pages)
                                                         ├─ Restart Night ──► PLAY
                                                         └─ Credits ────────► TITLE
```

Autosave writes at each Fault boundary (5 writes per Night) and at the Night start; a write takes ≤ 40 ms and never stalls a frame. One save slot.

---

## 7. Progression, difficulty and economy

### 7.1 Progression — the Night is the progression

There is no unlock, level, skill or gear progression. What changes over 1 500 s is: the Storm Stage (1 → 5), the Drift rate (0.50 → 0.68 %/s), the vertical distance each fault demands, and the number of systems a fault touches.

| Fault | Storm Stage during | Areas the fault forces you into | Vertical travel required | Systems touched | Observations | Par darkness |
|---|---|---|---|---|---|---|
| Wick Drain | 1 | Lamp Room, Watch Room | 7.2 m (from 2 × 3.6 m) | Lamp, Oil | 3 | 48 s |
| Clouded Optic | 2 | Lamp Room, Store Room | 36.0 m (from 2 × 18.0 m) | Lamp, Rotation | 3 | 66 s |
| Stalled Rotation | 3 | Lamp Room, Weight Shaft, Store Room | 36.0 m | Rotation, Carry | 4 | 84 s |
| Shattered Storm Pane | 4 | Lamp Room, Gallery, Store Room | 36.0 m + 8.4 m of Gallery ring | Lamp, Storm, Carry | 4 | 96 s |
| Dead Feed Line | 5 | Lamp Room, Watch Room, Pipe Landing, Store Room, Oil Cellar | 79.2 m (39.6 m down + 39.6 m up, from the route Lamp Room → Watch Room → Pipe Landing → Store Room → Pipe Landing → Oil Cellar → Watch Room → Lamp Room) | Oil, Lamp, Carry, Storm | 5 | 132 s |

### 7.2 Difficulty settings

| Setting | Steady | Keeper (default) | Dirty Night |
|---|---|---|---|
| Drift rate multiplier | 0.75× | 1.00× | 1.30× |
| Drift recovery | −0.80 %/s | −0.60 %/s | −0.50 %/s |
| Par margin at Dead Feed Line | 51 s | 15 s | 0 s (par is exact) |
| Storm Stage cap | 4 | 5 | 5 |
| Match strike failure on Gallery | never | Stage ≥ 4 | Stage ≥ 3 |
| Oil Reservoir start | 240 L | 186 L | 142 L |

Accessibility options are separate from difficulty and do not change the mode label: Assist HUD on/off, head bob 0–100 %, camera shake 0–100 %, rhythmic-tap actions converted to a 3.0 s hold, sustained-hold actions converted to a single press, subtitles for all non-speech audio events, Large Text, high-contrast interaction prompt, Drift Meter audio pings every 10 % above 50 %.

### 7.3 Economy — oil is the only resource

| Line | Litres |
|---|---|
| Day Tank at Night start | 34.0 |
| Oil Reservoir at Night start | 186.0 |
| Burned over 1 500 s lit time | −6.3 (from 0.0042 L/s × 1 500 s) |
| Dead Feed Line leak at 22 s par response | −7.7 (from 0.35 L/s × 22 s) |
| Oil Pump prime, one attempt | −0.4 |
| Day Tank at Passing Abeam, par play | 19.6 |
| Day Tank at Passing Abeam, worst survivable play | 0.9 |

There is no currency, no trade, no crafting and no second resource.

---

## 8. HUD and menus

### 8.1 HUD

Total default HUD coverage: **≤ 1.5 % of screen area**.

| Element | When shown | Size / position | Notes |
|---|---|---|---|
| Interaction dot | only while an interactable is targeted | 4 px Ø, screen centre | no persistent crosshair |
| Interaction prompt | targeted interactable, after 0.08 s dwell | glyph 28 px + noun at 20 px, 64 px below centre | struck through when unavailable |
| Carry render | item in slot | first-person right hand | not HUD — diegetic |
| Breath vignette | Breath < 60 | full-frame, 0–18 % opacity | scalable to 0 % |
| Gust letterbox pull | Gallery, Storm Stage ≥ 3 | 1.6° roll, 0.014 m shake | scalable to 0 % |
| Non-speech subtitles | option on | bottom centre, 22 px, max 2 lines | e.g. "[*Ardmore* sounds five short blasts]" |
| Assist HUD (option, default off) | always | top-left, 3 rows at 20 px | Drift %, Flame mm, Day Tank L |
| Pause overlay | paused | full-frame, 65 % Deep Storm Black scrim | |

There is no minimap, compass, objective list, waypoint, health bar, stamina bar, ammo counter, hit marker or damage number anywhere in the product.

### 8.2 Menu screens

| Screen | Contents |
|---|---|
| **Title** | Candlewick Light wordmark over a live 4.0 rpm optic render; New Night, Continue Night, Settings, Quit |
| **Settings → Display** | Resolution, window mode, VSync, frame cap (30/60/120/uncapped), render scale 50–100 %, FOV 48–78°, motion blur 0–100 %, brightness −2 to +2 EV |
| **Settings → Audio** | Master, Storm, Machine, Player, Music, UI (0–100 each), output mode Stereo/Headphone/5.1, non-speech subtitles on/off |
| **Settings → Controls** | Full rebind for all 16 actions, mouse sensitivity 1–10, gamepad sensitivity 1–10, invert Y, hold/toggle for Crouch and Lean-in |
| **Settings → Accessibility** | Assist HUD, head bob 0–100 %, camera shake 0–100 %, tap→hold conversion, hold→press conversion, Large Text, high-contrast prompts, Drift audio pings |
| **Settings → Watch Difficulty** | Steady / Keeper / Dirty Night, changeable mid-Night at a Fault boundary only |
| **Pause** | Resume, Logbook, Settings, Restart Night, Quit to Title; shows Ardmore Track % and Storm Stage as plain text |
| **Logbook** | 5 page spreads, navigable, readable from Pause or in-world without pausing |
| **Win card — Passing Abeam** | Night survived, peak Drift %, oil used L, 5 Logbook titles; Logbook, Restart Night, Credits |
| **Lose card — Grounding** | the fault that beat you, Drift at grounding (100 %), time dark in that cycle; Restart Night, Title |
| **Credits** | single scroll, 45 s, skippable after 3.0 s |
