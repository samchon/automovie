# Environments

Build a place, such as a furnished room, a terrain or an outdoor set, from the archetypes environment builders. The [archetypes README](https://github.com/samchon/automovie/tree/master/packages/archetypes#environments) introduces them, and their JSDoc owns their inputs.

## Choosing the source

Choose each piece's source by what defines it:

| Defined by | Source |
| --- | --- |
| Its numbers | An archetype, a room kit or a terrain recipe with its dimensions |
| A rule | A seeded generator: terrain `noise` relief, terrain `woods`, or a kit's count |
| Its looks | A commissioned mesh or image through [Sources](sources.md), [Diffusion](diffusion/SKILL.md) or [Crafting](crafting/SKILL.md) |

A builder or a seeded rule keeps the set deterministic and lets the environment check its support. A commissioned form placed as one piece by relation keeps both.

## Placing by relation

Place each piece by the relation that states the intent, from those the archetypes README introduces:

- a furnishing relation in `createFurnishedRoom` or a kit;
- a named anchor in an item's `at`, such as a table's `stack` or a terrain amenity;
- a terrain pad, or the start or end frame of a terrain path.

Type a coordinate only when no relation states the intent. A relation keeps its meaning when a reseeded model changes size, and a coordinate does not.

## One occurrence, then many

1. Build one occurrence of the room, stand or group.
2. Settle each piece's state in the environment's `support` findings as the support section below sets.
3. Check its look in a capture at the shot camera under [visual debugging](../visual-debugging/SKILL.md).
4. Repeat the checked occurrence through a kit count, a woods outline or an instance set.

## Support

The `support` findings refuse nothing, because a piece can be meant to hang or fly. Settle each state by its outcome, and the check ends when every piece has one:

| State | Outcome |
| --- | --- |
| `declared` | None here; prop placement validation judges the piece |
| `floating`, `sunk` | A relation or a support, or a note beside the piece saying why it hangs or flies on purpose |
| `resting`, `wall-borne` | None; the piece is supported |
| `unresolved` | A judgment by eye in the step 3 capture, because the piece's model has no measurable rest extent |

## Budgets

The builders refuse an instance set, a wood or a terrain lattice beyond its budget, and the refusal names the budget and what lowers it. Change what the refusal names, or split an instance set into more sets.
