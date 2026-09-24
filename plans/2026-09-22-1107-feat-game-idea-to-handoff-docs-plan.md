---
title: Game Idea to Design Handoff Docs - Plan
type: feat
date: 2026-09-22
topic: game-idea-to-handoff-docs
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# Game Idea to Design Handoff Docs - Plan

## Goal Capsule

- **Objective:** a developer's plain-English game idea becomes a set of five design docs, written in standard industry terms, that engineering, art, level and audio workers — human or agent — can each act on without asking the author what was meant.
- **Product authority:** step one of the game-building harness only: generating the doc set, refining it in conversation, and marking it approved. Later steps (asset generation, code generation, playtest) consume the docs and are not active scope.
- **Open blockers:** none.

---

## Product Contract

### Summary

Step one takes an idea in any form — one line or several paragraphs — and writes five cross-linked design docs covering the full game vision, with one first playable slice marked as the build target. The developer refines the set through conversation until they approve it, and approval hands it to the build steps.

### Problem Frame

A plain-English idea carries none of what a builder needs. "A zombie survival game" fixes no camera, no movement speed, no level layout, no palette, no win condition. Somebody has to decide those, and when nobody does, the builder decides silently and inconsistently.

Studios solved this long before AI: the design lead writes the docs that engineering, art and audio each work from. Research into AI game-generation systems shows the same split appearing on its own — the systems that produce working games write a design document first and build from it, and the ones that skip it produce games that compile and then violate their own core mechanic. The failure modes are well documented: quantities left vague ("many enemies"), no win, lose or pause flow, sections that contradict each other, features the builder cannot make, and games that pass every check while the mechanic they exist for is broken.

The cost lands twice. The developer cannot tell whether the plan matches their idea, because the plan is scattered across prose that never states a number. The build agents cannot start, because every missing value becomes an invention, and inventions from four separate agents do not agree.

### Key Decisions

- KD1. **Five cross-linked docs, not one document** (session-settled: user-directed — chosen over a single layered doc: it mirrors how studios hand off work by discipline). Governs R1, R2.
- KD2. **The vision doc is the hub.** It carries the slice, the assumptions, the non-goals and the index, so there is one entry point and one place where set-wide state lives. Governs R3.
- KD3. **Full vision plus one marked slice** (session-settled: user-approved — chosen over slice-only or a short complete game: ambitious ideas survive intact while the build target stays small). Governs R13.
- KD4. **Creative and build content only** (session-settled: user-directed — chosen over including market framing: budget, team, timeline and audience do not help anyone build the game). Governs R20.
- KD5. **Write first, ask nothing** (session-settled: user-directed — chosen over a clarifying-question round: the developer refines by conversation once there is something concrete to react to). Governs R14.
- KD6. **Industry vocabulary throughout** (session-settled: user-directed — readers are game developers, so core loop, pillars, 3Cs and beat charts are used directly rather than explained). Governs R4.
- KD7. **Art direction is written for generation** (session-settled: user-directed — assets are AI-generated, so the art bible has to hold a reusable style prompt and a named asset list, not mood words). Governs R9, R10.
- KD8. **A change updates every affected doc** (session-settled: user-approved — chosen over editing one section and flagging conflicts: the set stays consistent without the developer chasing dependents). Governs R19, R20, R21.
- KD9. **Approval alone finalizes the set** (session-settled: user-directed — chosen over a readiness check plus approval: the developer accepts that build agents may hit gaps rather than be gated). Governs R22.
- KD10. **One shared name per thing.** Areas, assets, mechanics and entities are named once and referenced by that name everywhere, which is what makes cross-doc consistency checkable at all. Governs R5.
- KD11. **The slice ships with acceptance checks.** Systems that verify a game against spec-derived statements catch broken core mechanics that a play-through misses. Governs R18.
- KD12. **The set lives in the game's repository** (session-settled: user-approved — chosen over harness-internal storage: git carries the history, the developer can edit the files directly, and every build agent reads one copy). Governs R24, R25.
- KD13. **Unity 6 with Blender 5.2.2 is the build target.** This repository provisions that toolchain and the sibling asset-agent research already assumes it, so the capability list has a concrete scope. Governs R26.

### Actors

- A1. **The developer** — gives the idea, reads the docs, asks for changes, approves.
- A2. **The step-one agent** — writes the set, applies changes across it, reports what changed.
- A3. **The build agents** — code, art, level and audio workers that read the approved set. They are downstream consumers here, not participants in step one.

<!-- ce-section: work-relationships -->
### How This Work Fits Together

This plan owns step one of the harness: turning an idea into an approved doc set. The rest of the harness is sketched below as it is currently understood, not as a committed roadmap.

- Asset generation — image and model generation from the art bible.
  - Depends on this work: the locked style prompt and asset table are its inputs.
  - Shares the asset names defined here.
- Game build — code and scene generation from the game design and level docs.
  - Depends on this work.
  - Targets Unity 6 with Blender 5.2.2, the toolchain this repository provisions.
  - Still to decide: whether it runs as one agent or several.
- Playtest and verification — running the slice against its acceptance checks.
  - Depends on this work: the checks come from the vision doc.
  - Can proceed independently of asset generation, given placeholder art.

### Requirements

**The doc set**

- R1. Step one produces five documents: a vision doc, a game design document, an art bible, a level design doc and an audio doc.
- R2. Each document is addressed to one discipline and is readable on its own, given the vision doc.
- R3. The vision doc is the hub: it carries the logline, the "X meets Y" anchor, player fantasy, three to five design pillars, the archetype line (genre, 2D or 3D, and camera perspective), the core loop at moment, session and meta scale, a first-minutes walkthrough written in second person from the player's point of view, the first playable slice, the assumptions list, the non-goals, and an index of the other four docs.
- R4. Every document uses standard industry vocabulary without glossing it.
- R5. Every area, asset, mechanic and entity has one name, and all five docs use that name when referring to it. Every quantity derived from another value records the game design document value it comes from.

**What each document carries**

- R6. The game design document specifies the 3Cs with numbers (character movement and its values, camera type and field of view, and the full input map), the player's verbs against the objects they act on, each system's rules, states, tuning knobs and edge cases, the entity roster with stats, the objectives and win and lose conditions, the game flow through menu, play, pause, win and lose, and the HUD and menu screens.
- R7. The level design doc specifies the setting, a metrics table appropriate to the archetype, every area of the full game, and the first slice's beat chart with beat type, intensity on a 0 to 5 scale, and duration.
- R8. Each area entry in the level design doc states its purpose, theme, mood, palette reference, landmarks, encounters, the mechanics it introduces, its expected playtime, its lighting key, a text layout sketch, and its audio reference.
- R9. The art bible specifies a realism rating, a locked style prompt reusable across every asset generation call, the palette with hex values and where each colour is used, shape language, material and texture rules, lighting keys, a do-and-don't list, and the target platform with the overall polygon and texture budget its per-asset budgets derive from.
- R10. The art bible carries an asset table where each row gives the asset's name, type, description, where it is used, whether it belongs to the first slice, at least one real-world dimension, the asset's class (prop, modular or character), its triangle budget and its texture resolution.
- R11. The audio doc specifies audio pillars, music per area and per game state with its transition rules, and a sound effect per gameplay event.
- R12. Every quantity in the set is a concrete value or range. A quantity the agent cannot derive becomes an assumption with a chosen value, never a vague word.

**Generating the set**

- R13. The set describes the full game vision, and the vision doc marks one first playable slice — one level or arena plus the complete core loop — as the build target, with everything else listed as deferred.
- R14. Step one writes the full set from whatever the developer gave it, without asking questions first, and records every choice the developer did not state as an assumption.
- R15. Each assumption states what was assumed, why, and which documents depend on it, and the list is ordered by how many documents depend on each one, with the archetype and core-loop choices first.
- R16. The vision doc's archetype line — genre, 2D or 3D, and camera perspective — determines which archetype-specific sections and metrics the set carries.
- R17. The set stays within what the build steps can produce, and no requirement in it depends on a capability the build steps lack.
- R18. The first playable slice carries acceptance checks: testable statements about the running game that a builder can verify, covering each step of the core loop named in the vision doc and each win and lose condition named in the game design document.

**Refining and approving**

- R19. A change request updates every section in every document that the change affects, following the shared names and the recorded derivations.
- R20. After each change, step one reports which documents and sections changed and why.
- R21. The developer can edit any assumption, and doing so triggers the same set-wide update as any other change.
- R22. The set is final when the developer approves it, with no other gate, and approval applies to the set as a whole.
- R23. No document carries market, budget, team, timeline or monetization content.
- R24. The set is written as files in the game project's repository, and every refinement round rewrites those files in place.
- R25. Step one reads the set from the repository at the start of every refinement round and treats those files as the current state, so an edit the developer made outside the conversation survives the rewrite and propagates like any other change.

**Inputs**

- R26. Step one is given a build-capability list before the first generation: a hand-authored file naming the engine and platform constraints, the asset types the art step can produce, and the systems the code step can implement. R17 and AE4 are evaluated against that file.

### Key Flows

- F1. First generation
  - **Trigger:** A1 describes a game idea.
  - **Actors:** A1, A2
  - **Steps:** A2 fixes the archetype from the idea; writes the vision doc, then the four discipline docs against it; records every unstated choice as an assumption; presents the set with its assumptions.
  - **Outcome:** a complete draft set, with no questions asked first.
  - **Covered by:** R1, R3, R13, R14, R15, R16

- F2. Refinement round
  - **Trigger:** A1 asks for a change, or edits an assumption.
  - **Actors:** A1, A2
  - **Steps:** A2 reads the set from the repository; finds every section the change reaches across all five docs; rewrites them so the set stays consistent; reports the documents and sections it touched and why.
  - **Outcome:** a consistent set and a change summary. The loop repeats without limit.
  - **Covered by:** R19, R20, R21, R25

- F3. Approval
  - **Trigger:** A1 approves the set.
  - **Actors:** A1, A2, A3
  - **Steps:** A2 marks the set final and hands it to the build steps.
  - **Outcome:** A3 begins from an approved set. No automated check runs first.
  - **Covered by:** R22

### Acceptance Examples

- AE1. Thin idea
  - **Covers R12, R14, R15.**
  - **Given** the developer writes only "a zombie game",
  - **When** step one generates the set,
  - **Then** the docs carry concrete values throughout — camera perspective, movement speed, zombie counts, level size — and each of those choices appears in the assumptions list with the documents that depend on it.

- AE2. Perspective change
  - **Covers R16, R19, R20.**
  - **Given** an approved-shape set built around a third-person camera,
  - **When** the developer asks for first-person instead,
  - **Then** the camera and input map in the game design document, the metrics and area layouts in the level design doc, and the asset list in the art bible are all updated, the archetype line changes, and the change summary names each document it touched.

- AE3. Cross-doc naming
  - **Covers R5, R10.**
  - **Given** the art bible lists an asset used in a named area,
  - **When** that area is read in the level design doc,
  - **Then** the area exists under exactly that name.

- AE4. Unbuildable feature
  - **Covers R17.**
  - **Given** the developer asks for a feature the build steps cannot produce,
  - **When** step one updates the set,
  - **Then** the set describes a version of the request the build steps can produce, and the gap between that and the request is recorded as an assumption.

- AE5. Slice checks
  - **Covers R13, R18.**
  - **Given** a finished set,
  - **When** a build agent reads the vision doc,
  - **Then** the first playable slice names the one area and the complete core loop it must deliver, and each acceptance check is a statement the agent can verify against the running game.

### Success Criteria

- A build agent can start its discipline's work from its own document plus the vision doc, without asking the developer a question.
- A reader of the set can find no two documents that contradict each other about a name, a number or a rule.
- The developer recognizes their idea in the vision doc's first page.

### Scope Boundaries

**Deferred for later**

- Generating assets, code, levels or audio. The docs are shaped to feed those steps; the steps themselves are separate work.
- Splitting or re-exporting the set into other formats for downstream tools.
- Any readiness or consistency check that gates approval.

**Outside this product's identity**

- Publisher pitch material: budget, team, timeline, funding ask, market analysis.
- Teaching game design. The docs are written for developers who already know the vocabulary.

### Dependencies / Assumptions

- The build steps target Unity 6 with Blender 5.2.2, the toolchain this repository provisions and the one the sibling asset-agent research assumes. The doc set's own content stays engine-neutral; the capability list in R26 is scoped to that toolchain.
- The build steps expose what they can and cannot produce, so step one can hold the set inside it (R17). Until they exist, that capability list is an input step one is given, not something it discovers.
- The developer reviews the set in conversation, the way plans are refined in Claude Code or Cursor. There is no separate editor UI.
- Doc length follows the idea. The one-page target covers the vision doc's front section, from the logline through the first-minutes walkthrough; the slice, the assumptions list and the acceptance checks run past it as the idea requires. The discipline docs go as deep as the archetype and the slice require.
- Assets are AI-generated, which is what makes the art bible's locked style prompt and named asset list load-bearing rather than decorative.

### Outstanding Questions

**Deferred to Planning**

- Which runtime runs the harness (Codex, Claude Agent SDK, Claude Managed Agents) and whether step one is one agent or several.
- Who maintains the build-capability list, and in what form it reaches step one.
- How a set-wide update is applied without rewriting unchanged text.
- Which folder in the game repository holds the set, and its file names.
- The archetype taxonomy, and which sections and metrics each archetype adds or removes.

### Sources / Research

Four parallel research passes fed this plan. The findings that shaped it:

- **Pitching without a demo.** Publishers almost never sign without a playable build; Kepler Interactive states the order plainly: "Demo > Video > Concept Art > Words". Guidance for pre-demo pitches recommends a player-POV walkthrough of the first minutes, three to four selling points, and an "X meets Y" line — which is why the walkthrough sits in the vision doc (R3). Sources: [rawfury.com/how-to-pitch-to-raw-fury](https://rawfury.com/how-to-pitch-to-raw-fury/), [pitch.devolverdigital.com](https://pitch.devolverdigital.com/), [kepler-interactive.com/kowloon](https://kepler-interactive.com/kowloon), [gamedeveloper.com — how to pitch a video game](https://www.gamedeveloper.com/business/you-don-t-have-their-curiosity-but-you-want-their-attention---how-to-pitch-a-video-game), [learn.microsoft.com — ID@Xbox onboarding](https://learn.microsoft.com/en-us/gaming/game-publishing/onboarding/onboarding-join-id-at-xbox).
- **Design doc structure.** The industry layers a 1–4 page concept doc over discipline docs; Librande's GDC talk notes most readers never get past the first page, which is why the vision doc is both the hub and one page. Section lists for the GDD, pillars, core loops, 3Cs and win/lose flow come from Tim Ryan's anatomy articles, the Unity and Chris Taylor templates, and modern lean-GDD writing. Sources: [gamedeveloper.com — anatomy of a design document](https://www.gamedeveloper.com/design/the-anatomy-of-a-design-document-part-1-documentation-guidelines-for-the-game-concept-and-proposal), [gamedeveloper.com — one-page designs](https://www.gamedeveloper.com/design/video-one-page-designs), [Unity GDD template](https://connect-prd-cdn.unity.com/20201215/83f3733d-3146-42de-8a69-f461d6662eb1/Game-Design-Document-Template.pdf), [codecks.io — modern GDDs](https://www.codecks.io/blog/writing-modern-game-design-documents/), [MDA framework](https://users.cs.northwestern.edu/~hunicke/MDA.pdf).
- **Level and art documentation.** Area entries, beat charts with 0–5 intensity, metrics tables, worldbuilding questions, lighting passes and art bible sections come from the Level Design Book, the beat chart article, World of Level Design's scale guide, Valve's TF2 stylization talk and published art bibles. Sources: [book.leveldesignbook.com — metrics](https://book.leveldesignbook.com/process/blockout/metrics), [book.leveldesignbook.com — pacing](https://book.leveldesignbook.com/process/preproduction/pacing), [gamedeveloper.com — beat chart](https://www.gamedeveloper.com/design/beat-chart-game-designer-s-best-friend), [Valve — stylization with a purpose](https://cdn.fastly.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf), [gamedeveloper.com — who needs an art bible](https://www.gamedeveloper.com/design/who-needs-an-art-bible-game-art-direction-from-indie-to-aaa).
- **AI game-generation prior art.** Working systems write a design doc first, classify the archetype, mix prose with tables and configs, state the first playable unit, and mark assumptions. Reported failure modes drove R12, R17 and R18: vague quantities, missing win/lose flow, contradictory sections, unbuildable features, and games that pass checks while violating their core mechanic. Spec-derived checks agreed with human judges 92.2% of the time versus 58.8% for an agent that merely played the game. Sources: [OpenGame (arXiv 2604.18394)](https://arxiv.org/abs/2604.18394), [GameGPT (arXiv 2310.08067)](https://arxiv.org/abs/2310.08067), [UniGen (arXiv 2509.26161)](https://arxiv.org/abs/2509.26161), [ChatGE (arXiv 2408.09386)](https://arxiv.org/abs/2408.09386), [DreamGarden (arXiv 2410.01791)](https://arxiv.org/abs/2410.01791), [Roblox Assistant planning mode](https://devforum.roblox.com/t/announcing-planning-mode-for-roblox-assistant/4580715).

---

## Deferred / Open Questions

### From 2026-09-22 review

- **Nothing commits the set, so the git history never appears** — Storing the set in the game's repository (P1, adversarial, confidence 75)

  A developer who runs several refinement rounds without committing loses every earlier version of all five docs, because each round rewrites the files in place and nothing in the plan commits them. Storing the set in the repository was chosen partly because git carries the history, and that benefit only exists if something commits between rounds. The per-round change summary is a natural commit message; who runs the commit — the harness or the developer — is the open question.

- **All five docs are written before the developer reacts to any of them** — First generation flow (P1, product-lens, confidence 75)

  The most likely first correction is that the agent read the idea as the wrong genre or camera, and today that surfaces only after all five docs exist, making the cheapest fix the most expensive round. The archetype determines which sections and metrics every doc carries, so a wrong one invalidates structure, not just content. Showing the one-page vision first and writing the rest after a reaction would catch it early, at the cost of a round trip the current flow avoids.

- **Full area depth is written for areas nobody will build** — Level design doc area coverage (P2, feasibility, product-lens, adversarial, confidence 100)

  Every refinement round gets slower and the drift surface larger as the idea grows, because each area of the full game carries eleven fields and any affecting change rewrites all of them, while only the slice's area is built. Stubbing non-slice areas to purpose and theme would keep rounds proportional to the build target. Against that, full vision depth is arguably what "full vision plus a slice" was chosen to preserve, so this is a scope call rather than a defect.
