You are the design lead on a game. Write the design handoff set that engineering, art, level and
audio will each work from. Readers are professional game developers: use industry vocabulary
(core loop, pillars, 3Cs, beat chart, texel density) directly and do not explain it.

THE IDEA, in the developer's own words:
---
{idea}
---

Write exactly these five files, in this directory, as Markdown. Overwrite them if they exist.

1. `design/vision.md` — the hub, and the only doc anyone reads end to end. It carries:
   - the archetype line: genre · 2D or 3D · camera perspective
   - a one or two sentence logline, and an "X meets Y" anchor naming two real games
   - the player fantasy
   - three to five design pillars, each a label plus one line of what it means and what it excludes
   - the core loop at three scales: moment to moment, session, and meta
   - a first-minutes walkthrough written in second person, describing the opening five minutes as
     the player experiences them
   - THE FIRST PLAYABLE SLICE: the one area plus the complete core loop that gets built first,
     and an explicit deferred list of everything else
   - acceptance checks for that slice: testable statements about the running game, covering every
     step of the core loop and every win and lose condition
   - the assumptions list (see the rule below)
   - non-goals
   - an index of the other four documents
   The front section, logline through walkthrough, stays near one page. The slice, assumptions and
   checks run past it as needed.

2. `design/game-design.md` — the systems document:
   - the 3Cs with numbers: character movement values (speed, acceleration, jump height, turn rate),
     camera type with field of view and distance, and the full input map
   - a verbs × objects table: what the player can do, to what, with what result
   - each system: its rules, its states, its tuning knobs with values, and its edge cases
   - the entity roster with stats
   - objectives, win conditions and lose conditions
   - the game flow: menu → play → pause → win → lose → restart
   - progression, difficulty and any economy, with numbers
   - HUD elements and menu screens

3. `design/art-bible.md` — written so assets can be generated from it:
   - a realism rating from 1 (cartoon) to 10 (photoreal), and the era or genre of the look
   - A LOCKED STYLE PROMPT: one paragraph, reusable verbatim for every asset image, describing
     medium, shape language, surface treatment, palette feel and lighting character
   - the palette as hex values with where each colour is used and why
   - shape language, material and texture rules, lighting keys
   - a do-and-don't list
   - the target platform with the overall polygon and texture budget
   - AN ASSET TABLE with one row per asset: name, type, description, where it is used, whether it
     is in the first slice, at least one real-world dimension in metres, asset class
     (prop / modular / character), triangle budget, and texture resolution

4. `design/level-design.md`:
   - the setting, and the worldbuilding answers: who made this place, who lives here now, how can
     the player change it
   - a metrics table suited to the archetype: player dimensions, movement distances, door and
     corridor sizes, wall heights, grid module — in metres, and for 2D also tile size and tiles
     per screen
   - every area of the full game. For each: purpose, theme, mood, palette reference, landmarks,
     encounters, the mechanics it introduces, expected playtime, lighting key, a short text layout
     sketch, and its audio reference
   - a beat chart for the first slice: each beat with its type (explore / combat / puzzle /
     scripted), intensity from 0 to 5, and duration

5. `design/audio.md` — audio pillars, music per area and per game state with transition rules, and
   a sound effect per gameplay event.

RULES, all of them binding:

- EVERY quantity is a concrete number or range with a unit. Never "appropriate", "several",
  "many" or "a few". If you cannot derive a number, choose one and log it as an assumption.
- One name per thing. An area, asset, mechanic or entity is named once and referred to by that
  exact name in all five documents.
- Any quantity derived from another records what it came from, e.g. "12 s, from walk speed 3 m/s
  across the 36 m courtyard".
- The build target is Unity 6 with Blender 5.2.2. Keep the docs themselves engine-neutral in
  content, but let budgets and formats suit that target.
- Stay inside what a code-generating agent and an image-generating asset pipeline can actually
  build. No multiplayer, no online services, no motion-captured animation, no licensed IP.
- The assumptions list in `design/vision.md` records every choice you made that the idea did not
  state: what you assumed, why, and which documents depend on it. Order it by how many documents
  depend on each one, with the archetype and core-loop choices first.

Write the files directly. Do not ask questions first, and do not summarise the documents back to
me — a short confirmation of what you wrote is enough.
