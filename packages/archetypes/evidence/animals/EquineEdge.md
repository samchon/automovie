# src/animals/EquineEdge.ts#EquineEdge

## @evidence contracts/development/common.md#meaningful-documentation

States why the course's pitch is corrected, over which span and against what.

## @evidence contracts/development/design.md#principled-representation

An edge's course distance, the pitches either side, and the hooves' reach ahead of and behind the root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `EquineFootwork` for the bank techniques' faces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The corrected pitch equals the course's once both pairs are past the edge; nothing else of the course changes.

# src/animals/EquineEdge.ts#EquineEdge.IEdge

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and sign.

## @evidence contracts/development/design.md#principled-representation

A course distance, two pitches and two hoof offsets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Built by `of`, read by `pitch`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineEdge.ts#EquineEdge.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the edges returned.

## @evidence contracts/development/implementation.md#principled-implementation

Each leg's pitch is its grade's angle, nose-down for a descent; a level or absent neighbour pitches none.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three pitches and two records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course plan's leg spans.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns two records.

# src/animals/EquineEdge.ts#EquineEdge.pitch

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and sign.

## @evidence contracts/development/implementation.md#principled-implementation

The body's pitch goes linearly in course distance from the pitch before to the one after while the edge lies between its fore and hind hooves; the correction is that pitch less the course's own, which switches at the root.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share and one difference per edge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few edges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number.
