# CANDLEWICK LIGHT — Audio

Companion to `design/vision.md`, `design/game-design.md`, `design/level-design.md` and `design/art-bible.md`. Every area, system, fault, entity and asset name below is the canonical name used in all five documents.

Delivery: 48 kHz / 24-bit WAV source, Vorbis q7 for loops and ADPCM for short one-shots in Unity 6. No streamed music stems longer than 90 s.

---

## 1. Audio pillars

1. **The Machine Is Audible Before It Is Visible.** Every mechanical state has a sound, and the sound changes 8–12 s before the visual does. A keeper diagnoses by ear from one floor away. *Excludes:* silent state changes, UI beeps standing in for machine sound, any fault whose only tell is visual.
2. **Silence Is An Instrument.** Music is absent for 55–65 % of the Night's 1 500 s; the storm bed is the default and the score is the exception. *Excludes:* wall-to-wall underscore, ambient pads that never stop, music covering a fault's audio tell.
3. **Locked To The Light.** The score runs at **64 BPM, 4/4, bar = 3.750 s**, so the **Fl W 7.5 s** flash lands exactly on every second bar line. The lamp is the game's metronome. *Excludes:* free-tempo cues, tempo changes mid-state, rubato in any looping layer.
4. **Reverb Is Altitude.** Each area's RT60 is a wayfinding instrument — 1.10 s on the **Service Stair**, 1.90 s in the **Weight Shaft**, 0.35 s in the **Lamp Room**, 0.00 s on the **Gallery**. A blindfolded player can name the floor. *Excludes:* one global reverb, reverb that does not change on a door state, any area sharing another area's impulse.
5. **No Voice.** There is no speech, no narration, no grunt, no radio. The **Ardmore**'s 148 Hz whistle is the only thing in the game that talks. *Excludes:* dialogue, VO, breath-acted emotion beyond the three Breath layers, sung vocals.

---

## 2. Mix targets

| Target | Value |
|---|---|
| Integrated loudness, full Night | −16.0 LUFS |
| True peak ceiling | −1.5 dBTP |
| Loudness range (LRA) | 11–15 LU — wide on purpose |
| Quietest designed moment (**Oil Cellar**, lamp lit, no action) | −44 dBFS RMS |
| Loudest designed moment (**Gallery**, Storm Stage 5, gust) | −8 dBFS RMS |
| Buses | Storm, Machine, Player, Music, UI |
| Bus headroom at unity | Storm −6 dB, Machine −8 dB, Player −12 dB, Music −10 dB, UI −18 dB |
| Voice count cap | 96 simultaneous, 48 on Steam Deck |
| Storm duck on relight | Storm bus −4.5 dB over 0.40 s, holds 6.0 s, returns over 2.5 s |
| Machine duck on **Logbook** open | Machine bus −3.0 dB over 0.25 s |
| Sidechain | Music bus ducks −2.5 dB whenever any Machine event above −20 dBFS fires, 80 ms attack / 600 ms release |
| Output modes | Stereo, Headphone (binaural HRTF on Storm and Machine buses), 5.1 |
| Non-speech subtitles | all 6 **Ardmore** whistle events, all 5 fault onsets, the 4.0 L low-oil cue, the Drift ≥ 85 % warning |

---

## 3. Music

### 3.1 Instrumentation

Solo cello (C2–A4, the lead voice), bowed double bass (drone, E1–D2), harmonium (pumped, allowed to drift ±12 cents), prepared piano (felt-damped, two screws in the low register), bowed metal plate, bowed glass (**Relight** only), and tape hiss at −48 dBFS under every cue. No percussion kit, no synthesiser, no choir, no brass, no guitar. Tonal centre **D minor**, drone on D1 (36.71 Hz) and D2 (73.42 Hz).

All cues are authored in 3.750 s bars and loop on 4-bar (15.0 s) or 8-bar (30.0 s) boundaries so that every loop point coincides with a **Fl W 7.5 s** flash.

### 3.2 Music per area

The area layer is a thin bed that plays only while the current state permits music. It never plays during state **S1 Watch**.

| Area | Area layer | Instrumentation | Level | Notes |
|---|---|---|---|---|
| Oil Cellar | `mus_cellar_drone` | bowed double bass D1, tape hiss | −26 dBFS | no cello at all; the deepest area gets the least melody |
| Keeper's Quarters | `mus_quarters_harmonium` | harmonium D minor, 4-bar loop | −22 dBFS | the only cue with a major third (F♮ → F♯ passing tone), once per loop |
| Workshop | `mus_workshop_pno` | prepared piano, single notes on bar 1 of 4 | −24 dBFS | |
| Store Room | `mus_store_pno` | prepared piano, same patch, transposed +5 semitones | −24 dBFS | shares the Workshop patch so the two tool floors rhyme |
| Landing L4 | — | none | — | landings are deliberately unscored |
| Landing L5 | — | none | — | as above |
| Pipe Landing | `mus_pipe_metal` | bowed metal plate, 8-bar swell | −25 dBFS | |
| Weight Shaft | `mus_shaft_bass` | bowed double bass, glissando across 8 bars | −23 dBFS | pitch falls as the **Drive Weight** height falls, mapped 18.0 m → D2, 0.0 m → A1 |
| Watch Room | `mus_watch_cello` | solo cello, one sustained note per 2 bars | −21 dBFS | the game's primary theme statement |
| Lamp Room | `mus_lamp_cello_hi` | solo cello upper register, harmonium pad | −19 dBFS | the loudest area layer; the lamp is the subject |
| Gallery | `mus_gallery_none` | none — the wind is the cue | — | stepping outside kills the Music bus over 0.30 s; stepping in restores it over 0.80 s |
| Service Stair | `mus_stair_bass_pulse` | double bass, one attack per bar | −24 dBFS | pulse rate is fixed at 64 BPM and does not follow footsteps |
| Conduit Crawl | — | none | — | |

### 3.3 Music per game state

| State | Trigger | Cue | Tempo | Length | Level |
|---|---|---|---|---|---|
| **S0 Title** | Title screen | `mus_s0_title` — solo cello over bass drone, 8 bars | 64 BPM | 30.0 s loop | −18 dBFS |
| **S1 Watch** | lamp read, Drift 0–49 % | **silence** plus `mus_s1_sting` — one cello note on the flash, every 16 bars (60.0 s) | 64 BPM | 3.75 s one-shot | −30 dBFS |
| **S1b Watch, uneasy** | lamp read, Drift 50–84 % | area layer only, no S1 sting | 64 BPM | area loop | area level |
| **S2 Fault** | any fault fires (light unread) | `mus_s2_fault` — bass drone + prepared piano on bar 1 and 3, area layer on top | 64 BPM | 30.0 s loop | −20 dBFS |
| **S3 Critical** | Drift ≥ 85 % | `mus_s3_critical` — S2 plus cello tremolo on D3 and a bowed metal bed; harmonium detunes to −25 cents | 64 BPM | 15.0 s loop | −15 dBFS |
| **S4 Relight** | **Flame Height** crosses 60 mm rising | `mus_s4_relight` — bowed glass and full cello, 4 bars, resolves D minor → D suspended | 64 BPM | 15.0 s one-shot | −14 dBFS |
| **S5 Dawn** | Ardmore Track 100 %, Drift < 100 % | `mus_s5_dawn` — cello, harmonium, bass; the only cue that ends on a major chord (D major) | 64 BPM | 14.0 s, non-looping | −13 dBFS |
| **S6 Grounding** | Drift 100 % | `mus_s6_grounding` — bass drone alone, no cello, harmonium sustains through the 148 Hz jammed whistle | 64 BPM | 22.0 s, non-looping | −17 dBFS |
| **S7 Paused** | Pause | all Music bus voices to −24 dB over 0.20 s, no new cue | — | — | −24 dB offset |

**Silence audit.** At par play the Music bus is above −40 dBFS for 555 s of the 1 500 s Night — 426 s of **S2**, 40 s of **S3**, 75 s of **S4** (5 × 15.0 s) and 14 s of **S5** — giving **63 % silence**, inside the 55–65 % pillar-3 budget. If a playtest build measures outside that window, cut or extend the **S1b** area layers first; never touch **S2** or **S4**.

### 3.4 Transition rules

All transitions are quantised to the 3.750 s bar grid unless marked "immediate". Maximum quantise wait is therefore 3.75 s, which is within one flash interval.

| From → To | Rule |
|---|---|
| S0 → S1 | On New Night: `mus_s0_title` fades over 2 bars (7.50 s) during load; S1 begins silent. |
| S1 → S2 | **Immediate**, not quantised. The fault's own audio tell (§4) lands on frame 1; the `mus_s2_fault` loop enters on the **next bar line**, so the player hears the machine fail before they hear the score react. Maximum gap 3.75 s. |
| S1 → S1b | Crossfade area layer in over 2 bars (7.50 s) when Drift crosses 50 % rising. |
| S1b → S1 | Crossfade area layer out over 4 bars (15.00 s) when Drift crosses 45 % falling. 5 % hysteresis prevents chatter. |
| S2 → S3 | Layer-add on the next bar line: cello tremolo and bowed metal enter, harmonium pitch ramps −25 cents over 2 bars. The S2 loop keeps running underneath and does not restart. |
| S3 → S2 | Layer-remove over 4 bars (15.00 s) when Drift crosses 80 % falling. 5 % hysteresis. |
| S2 or S3 → S4 | **Immediate** on **Flame Height** crossing 60 mm rising. S2/S3 loops hard-stop with a 0.12 s fade; `mus_s4_relight` starts on the same frame and is the only cue permitted to break the bar grid — it re-establishes the grid on its own downbeat, and the **Fresnel Optic**'s flash phase is re-anchored to it within 7.5 s. |
| S4 → S1 | `mus_s4_relight` plays out its full 4 bars; S1 begins silent on the following bar line. |
| S4 → S2 | If the light becomes unread again inside S4 (a 31 mm underfed flame self-extinguishing, per the Lamp System), S4 cuts at 0.12 s and S2 re-enters immediately. This is the sound of a fix that did not hold and it must be brutal. |
| Any → S5 | Quantised to the next bar line. All other Music voices fade over 1 bar (3.75 s). |
| Any → S6 | **Immediate**. All Music voices hard-stop at 0.08 s. `mus_s6_grounding` begins on the same frame as the hull-on-rock sustain. |
| Any → S7 (Pause) | **Immediate**, −24 dB over 0.20 s, playhead retained. |
| S7 → previous | Restore over 0.35 s from the retained playhead; do not restart the loop. |
| Entering Gallery | Music bus → −∞ over 0.30 s regardless of state, and the area reverb send goes to zero in the same 0.30 s. |
| Leaving Gallery | Music bus restores over 0.80 s to the state's level, entering on the next bar line if the state is S2 or S3. |
| Opening the Logbook | Machine bus −3.0 dB over 0.25 s. Music unchanged — the **Logbook** does not pause the game and must not sound like it does. |
| Difficulty change at a Fault boundary | No audible transition; the new Drift rates take effect silently. |

---

## 4. Sound effects — one per gameplay event

Format: `sfx_<system>_<event>`. "Var" is the number of round-robin variations authored. Level is peak dBFS at unity on its bus. All positional sources are 3D with the area's reverb send; UI sources are 2D.

### 4.1 Lamp System

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Lamp burning, nominal 82 mm | `sfx_lamp_burn_loop` | 1 | −22 | 240–900 Hz vapour roar, filtered-noise core, gain mapped linearly to Flame Height 60–82 mm |
| Flame starving (pressure < 1.30 bar) | `sfx_lamp_burn_unstable` | 1 | −21 | the burn loop detuned −3 semitones with a 3.4 Hz amplitude wobble; crossfades in over 1.5 s. **This is the game's most important sound** — it is the 8–12 s warning pillar 1 promises |
| Guttering, Wick Drain | `sfx_lamp_gutter_slow` | 2 | −19 | 6.0 s downward sweep, 900 → 180 Hz, with two false recoveries |
| Guttering, Shattered Storm Pane | `sfx_lamp_gutter_snuff` | 2 | −16 | 2.0 s wind-snuff, broadband, hard tail |
| Flame out | `sfx_lamp_out` | 3 | −18 | final 0.35 s puff and the abrupt absence of the burn loop; the absence is authored as a 0.4 s reverse-reverb tail |
| Match strike, success | `sfx_lamp_match_strike` | 5 | −20 | phosphorus scrape, 0.18 s |
| Match strike, fail (wind ≥ 22 m/s) | `sfx_lamp_match_fail` | 4 | −22 | scrape with no catch, followed by a gust swallow |
| Catching, 0 → 82 mm | `sfx_lamp_catch` | 2 | −17 | 2.2 s ignition swell matching the Catching state exactly |
| Beam cut-in at 60 mm | `sfx_lamp_beam_on` | 1 | −24 | sub-audible 28 Hz thump plus a 3 kHz glass shimmer; the sound of the room becoming bright |
| Wick trim, one snip | `sfx_lamp_wick_snip` | 4 | −26 | brass scissor cut through char, 0.22 s |
| Wick trim, third snip complete | `sfx_lamp_wick_done` | 1 | −24 | the snip plus a small brass set-down |

### 4.2 Oil System

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Oil flowing in Feed Line Run | `sfx_oil_flow_loop` | 1 | −34 | 110–380 Hz liquid hiss, gain mapped to Feed Pressure 0.0–1.6 bar |
| Reservoir Cock turning | `sfx_oil_cock_turn` | 2 | −23 | brass plug grind over 3.0 s, gritty packing gland |
| Reservoir Cock hard stop at 90° | `sfx_oil_cock_stop` | 2 | −21 | metallic seat |
| Reservoir Cock released early | `sfx_oil_cock_revert` | 2 | −24 | 0.4 s spring-back |
| Feed Pressure rising | `sfx_oil_pressure_rise` | 1 | −27 | 4.0 s gurgle-and-fill through the riser, pitched up 4 semitones across its length |
| Oil Sight Glass float, low-oil cue at 4.0 L | `sfx_oil_low_tick` | 1 | −25 | glass-and-brass tick at 0.5 Hz; subtitled |
| Oil Pump prime | `sfx_oil_pump_prime` | 2 | −22 | 2.2 s suck-and-catch |
| Oil Pump stroke, in cadence | `sfx_oil_pump_stroke_good` | 6 | −20 | full iron stroke with a wet delivery thump |
| Oil Pump stroke, off cadence | `sfx_oil_pump_stroke_poor` | 4 | −24 | dry stroke, no delivery thump — the cadence feedback is entirely audio |
| Oil Pump loses prime at 25 s | `sfx_oil_pump_lose_prime` | 1 | −23 | descending air gulp |
| Day Tank overflow | `sfx_oil_overflow` | 1 | −18 | 0.22 L/s onto an iron floor plate, unmistakable, loops until stopped |
| Feed Line cracks (Dead Feed Line onset) | `sfx_oil_line_crack` | 1 | −14 | 32 mm brass union splitting; the loudest single Machine event in the game |
| Feed Line leak | `sfx_oil_leak_loop` | 1 | −26 | 0.35 L/s onto stone, loops until the Reservoir Cock is shut |
| Oil drip after the leak stops | `sfx_oil_drip` | 4 | −32 | 0.7 Hz, decaying over 90 s |
| Feed Hose coupling made | `sfx_oil_hose_couple` | 2 | −22 | two brass couplings, 0.8 s, with a final quarter-turn |
| Oil Can spill while hurrying | `sfx_oil_can_spill` | 2 | −21 | 0.80 L/s glugging plus the player's own stumble |

### 4.3 Rotation System

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Rotation Drive running | `sfx_rot_drive_loop` | 1 | −28 | brass clockwork bed, governor fly whir at 380 Hz |
| Rotation Tell-tale click | `sfx_rot_tell_click` | 3 | −26 | one click per 3.75 s, exactly on the bar line |
| Fresnel Optic roller race | `sfx_rot_race_groan` | 1 | −30 | 0.07 Hz brass groan, pitch follows rpm |
| Drive Weight descending | `sfx_rot_weight_creak` | 3 | −31 | wire-rope creak at 0.3 Hz in the Weight Shaft |
| Drive Weight bottoms out | `sfx_rot_weight_bottom` | 1 | −17 | 190 kg of iron onto a stone shaft floor, with a 1.9 s Weight Shaft tail |
| Rotation stall, coast-down | `sfx_rot_coast_down` | 1 | −24 | 5.5 s deceleration of the whole drive bed, ending in silence where the tell-tale used to click. **The absence of `sfx_rot_tell_click` is the fault's primary tell** |
| Winding Crank fitted | `sfx_rot_crank_fit` | 2 | −22 | square socket seating |
| Winding, in cadence | `sfx_rot_wind_good` | 4 | −19 | ratchet at 1.4–1.8 rev/s with a rising rope tension whine |
| Winding, off cadence | `sfx_rot_wind_poor` | 4 | −22 | slipping ratchet, no tension whine |
| Winding hard stop at 18.0 m | `sfx_rot_wind_stop` | 1 | −18 | mechanical clack and the fly re-engaging |

### 4.4 Storm System

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Wind bed, per Storm Stage | `sfx_storm_wind_s1`…`s5` | 5 | −34 to −8 | five authored beds at 14 / 19 / 24 / 28 / 32 m/s; crossfade 6.0 s on Stage change |
| Gust | `sfx_storm_gust` | 6 | +6 dB over the bed | 1.2 s attack, 2.1 s decay, 1.45× base; period 11.0 s at Stage 1 down to 4.0 s at Stage 5 |
| Rain on Storm Pane | `sfx_storm_rain_glass` | 3 | −30 to −16 | density mapped to 20–95 mm/h |
| Rain on Gallery grating | `sfx_storm_rain_grate` | 3 | −26 to −12 | brighter, 2–8 kHz |
| Spray sheet over the Gallery Rail | `sfx_storm_spray` | 4 | −12 | every 9–16 s at Storm Stage ≥ 4 |
| Thunder | `sfx_storm_thunder` | 6 | −10 | interval 95 s at Stage 1 to 26 s at Stage 5; delayed 1.4–4.0 s after a lightning flash (from 340 m/s over 480–1 360 m) |
| Lightning flash (audio companion) | `sfx_storm_flash_air` | 3 | −30 | 0.12 s air-crackle for near strikes only |
| Window Splay sash rattle | `sfx_storm_sash` | 4 | −24 | 4.2 Hz at Landing L4, 4.8 Hz at Landing L5 |
| Gallery Rail howl | `sfx_storm_rail_howl` | 1 | −18 | 90–260 Hz, Gallery only, gain follows wind speed |
| Surf on Rock Base | `sfx_storm_surf_rock` | 4 | −30 | 8 s period, audible from the Gallery and Landing L4 |
| Surf on Skerry Shoal | `sfx_storm_surf_shoal` | 3 | −22 | audible from **every interior** once Drift ≥ 95 %; this is the Breaking state's tell |
| Range Stove flue moan | `sfx_storm_flue_moan` | 2 | −28 | Keeper's Quarters only, +6 dB per Storm Stage above 2 |

### 4.5 Drift System and the Ardmore

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Ardmore engine, distant | `sfx_ship_engine_loop` | 1 | −38 to −26 | 4-cylinder triple-expansion thump at 1.4 Hz, gain by range 8 000 → 620 m |
| Ardmore one prolonged blast (sighted, and at Passing Abeam) | `sfx_ship_whistle_long` | 1 | −18 | 148 Hz, 6.0 s, delayed by range ÷ 340 m/s (23.5 s at 8 000 m); subtitled |
| Ardmore five short blasts (Drift ≥ 85 %, every 20 s) | `sfx_ship_whistle_five` | 1 | −16 | 5 × 0.9 s at 148 Hz; subtitled as the in-danger signal |
| Drift audio ping (accessibility option) | `sfx_ui_drift_ping` | 1 | −30 | one ping per 10 % above 50 %; UI bus, 2D |
| Hull on rock (Grounding) | `sfx_ship_grounding` | 1 | −8 | 22.0 s: 4.0 s of swing, steel-on-rock sustain entering at 6.0 s, whistle jamming open at 11.0 s |
| Passing Abeam | `sfx_ship_abeam` | 1 | −20 | engine passing to the right, one long blast, gulls at 14.0 s |

### 4.6 Player

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Footstep, iron floor plate | `sfx_ply_step_iron` | 8 | −26 | interval 0.58 s walking, 0.36 s hurrying |
| Footstep, oak stair tread | `sfx_ply_step_oak` | 8 | −27 | pitched 4 semitones lower on S1 than on S7 — the stair's altitude is audible |
| Footstep, Gallery grating | `sfx_ply_step_grate` | 8 | −24 | bright, ringing, no reverb send |
| Footstep, stone (Oil Cellar, Conduit Crawl) | `sfx_ply_step_stone` | 8 | −28 | |
| Hand on Stair Handrail | `sfx_ply_rail_slide` | 4 | −30 | triggers on every 3rd step while ascending |
| Jump / land | `sfx_ply_jump`, `sfx_ply_land` | 4 each | −25 | land variant per surface |
| Fall Injury (> 4.00 m) | `sfx_ply_fall_injury` | 2 | −14 | impact, a 6.0 s winded layer, and Breath forced to 0 |
| Breathing, Breath 70 / 40 / 15 | `sfx_ply_breath_1/2/3` | 3 loops | −30 / −24 / −18 | crossfaded 1.5 s at each threshold |
| Crouch enter / exit | `sfx_ply_crouch` | 3 | −30 | oilskin and knee |
| Brace on the Gallery | `sfx_ply_brace_cloth` | 4 | −22 | oilskin cape snapping in 14–32 m/s wind |
| Conduit Crawl movement | `sfx_ply_crawl` | 6 | −24 | cloth on granite, close-mic |

### 4.7 Interaction and Carry

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Interactable targeted | — | — | — | **no sound.** Targeting is silent by design; only actions make noise |
| Interact, generic | `sfx_int_generic` | 4 | −26 | |
| Take item | `sfx_int_take` | 4 | −25 | per-material variant for brass, oak, cloth, iron |
| Place item at socket | `sfx_int_place` | 4 | −24 | includes the 0.35 m snap settle |
| Refusal, carry slot full | `sfx_int_refuse` | 2 | −24 | dry wooden knock, 0.18 s |
| Stow / Draw | `sfx_int_stow`, `sfx_int_draw` | 3 each | −28 | oilskin pocket |
| Watch Desk drawer open / close | `sfx_int_drawer` | 3 | −25 | 0.45 s oak on oak |
| Interior Door open / close | `sfx_int_door` | 4 | −22 | with a reverb-send change on the same frame, because doors change the area's RT60 |
| Gallery Door open | `sfx_int_gallery_door` | 2 | −12 | iron dogs, then the wind arriving; the reverb send goes to zero over 0.30 s |
| Oil Cellar hatch | `sfx_int_hatch` | 2 | −23 | |
| Lean-in enter / exit | `sfx_int_lean` | 2 | −34 | a breath held and released; the only cue that is purely emotional |
| Keeper's Lantern toggle | `sfx_int_lantern` | 3 | −26 | wire bail, glass, a small flare |
| Watch Telescope raise / lower | `sfx_int_telescope` | 3 | −25 | three brass draws |
| Storm Board carry, per step | `sfx_int_board_carry` | 4 | −22 | 14 kg of tarred oak against the player's chest |
| Board Clamp tighten | `sfx_int_clamp` | 3 | −20 | 3.2 s iron screw, rising pitch to a hard stop |
| Storm Pane shatters | `sfx_int_pane_break` | 3 | −10 | hand-blown glass into a 32 m/s wind, 1.4 s of debris across the grating |
| Optic Cloth wipe | `sfx_int_wipe` | 4 | −27 | chamois on glass, 2.4 s, soot grit reducing across its length |
| Logbook open / page / close | `sfx_int_logbook` | 4 | −29 | paper and ribbon |
| Chalk on the Bearing Board | `sfx_int_chalk` | 4 | −28 | slate |
| Dropped item sliding down the Service Stair | `sfx_int_item_slide` | 3 | −22 | tumble at 1.8 m/s, ending on a landing |

### 4.8 UI and flow

| Event | Cue | Var | Level | Description |
|---|---|---|---|---|
| Menu move | `sfx_ui_move` | 2 | −30 | a single prepared-piano note, D or A |
| Menu confirm | `sfx_ui_confirm` | 1 | −28 | cello pizzicato on D |
| Menu back | `sfx_ui_back` | 1 | −30 | cello pizzicato on A |
| Pause enter / exit | `sfx_ui_pause` | 1 | −26 | the whole mix ducking is the cue; a 0.20 s harmonium exhale over it |
| Autosave written | `sfx_ui_save` | 1 | −34 | one pen-nib tick; never interrupts anything |
| Logbook page written | `sfx_ui_log_written` | 1 | −26 | pen stroke plus a blotter press, fires once per fault repaired |
| Win card | `sfx_ui_win` | 1 | −22 | the tail of `mus_s5_dawn` with a gull at 14.0 s |
| Lose card | `sfx_ui_lose` | 1 | −24 | the jammed 148 Hz whistle fading over 8.0 s |
| Subtitle appears | — | — | — | no sound |

---

## 5. Reverb zones

One impulse per area, switched on the frame a door state changes. No global reverb.

| Area | RT60 | Character |
|---|---|---|
| Oil Cellar | 0.90 s | 62 Hz room mode, stone-lined, dark |
| Keeper's Quarters | 0.55 s | soft, furnished, plastered |
| Workshop | 0.70 s | 1.6 kHz flutter off the render |
| Store Room | 0.60 s local + 1.40 s Weight Shaft tail | two-zone blend at the shaft head |
| Landing L4 | 1.10 s | stair tube, 180–400 Hz |
| Landing L5 | 1.10 s | as L4 |
| Pipe Landing | 0.80 s | metallic, 500 Hz–2 kHz ring |
| Weight Shaft | 1.90 s | 38 Hz axial mode, 4.1 kHz flutter |
| Watch Room | 0.50 s | wood floor over stone |
| Lamp Room | 0.35 s | bright glazing ring, 2–8 kHz |
| Gallery | 0.00 s | none — the loss of reverb on crossing the Gallery Storm Sill is a designed event and the transition is 0.30 s |
| Service Stair | 1.10 s | 11 Hz tread flutter echo |
| Conduit Crawl | 0.25 s | hard 380 Hz standing wave |
