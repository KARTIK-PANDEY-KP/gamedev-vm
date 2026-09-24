Read the design set in `design/` — all five documents — and derive the complete list of assets this
game needs built.

Sources to mine, in this order:
1. the art bible's asset table (every row is an entry)
2. the game design document's entity roster (player, enemies, NPCs, pickups, projectiles)
3. every area in the level design document — expand each into the modular kit pieces, set dressing
   and tiling materials that area implies but the asset table never named
4. the HUD and menu screens (UI entries), and any effect a system's rules imply (VFX entries)

Rules:

- One entry per thing that gets built separately. Anything a character carries is its own entry,
  never part of the character.
- `id` is a stable kebab-case slug, unique, derived from the name.
- `name` matches the name used in the design documents exactly, when the documents name it.
- `asset_class` is one of: character, prop, kit_piece, environment, material, vfx, ui.
- `tier` is hero, mid or background. Tier drives every budget downstream, so judge it by how close
  the player gets and how often they look at it, not by how much you like the asset.
- `in_slice` is true only for assets the first playable slice needs.
- `derived_from` lists the documents and sections the entry came from, as `file.md#section-heading`.
- `note` is one line on what it is, for a reader scanning the list.

Return ONLY the JSON object described by the output schema. Write no files.
