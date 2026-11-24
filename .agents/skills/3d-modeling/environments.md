# Environments

Build a place, such as a furnished room, a terrain or an outdoor set, from the archetypes environment builders. The [archetypes README](https://github.com/samchon/automovie/tree/master/packages/archetypes#environments) introduces them, and their JSDoc owns their inputs.

## Choosing the source

Choose the source by what defines the thing:

| Defined by | Source |
| --- | --- |
| Its numbers | An archetype, a room kit or a terrain recipe with its dimensions |
| A rule | A seeded generator: terrain `noise` relief, terrain `woods`, or a kit's count |
| Its looks | A commissioned mesh or image through [Sources](sources.md), [Diffusion](diffusion/SKILL.md) or [Crafting](crafting/SKILL.md) |

A builder or a seeded rule keeps the set deterministic and lets the environment check its support. A commissioned form placed as one piece by relation keeps both.

## Placing by relation

Place each piece by the relation that states the intent:

- a furnishing relation in `createFurnishedRoom` or a kit: against a `wall`, `after` an earlier piece along that wall, or `facing` an earlier piece;
- a named anchor in an item's `at`, such as a table's `stack` or a terrain amenity;
- a terrain pad, or the start or end frame of a terrain path.

Type a coordinate only when no relation states the intent. A relation keeps its meaning when a reseeded model changes size, and a coordinate does not.

## One occurrence, then many

1. Build one occurrence of the room, stand or group.
2. Check its support in the environment's `support` findings. Every piece should be `resting`, `declared` or `wall-borne`. Give a `floating` or `sunk` piece a relation or a support.
3. Check its look in a capture at the shot camera under [visual debugging](../visual-debugging/SKILL.md).
4. Repeat the checked occurrence through a kit count, a woods outline or an instance set.

## Budgets

The builders refuse work beyond these budgets and name the fields to change:

| Budget | Lowered by |
| --- | --- |
| 100,000 slots per instance set (`IAutoMovieInstanceSetDesign.count`) | A smaller tree-disk or woods `count`, a wider woods `spacing`, or more sets |
| 1,000,000 grid cells per wood | A wider woods `spacing` or a smaller `outline` |
| 1,000,000 samples per terrain lattice | Fewer noise `octaves`, a longer `wavelength`, a larger `meshTolerance`, a smaller `size`, or wider pad and path shoulders |
