# src/production/IAutoMovieFormationGrounding.ts#IAutoMovieFormationGrounding

## @evidence contracts/development/design.md#principled-representation

Height is relief, the ground height under a member minus the ground height under the anchor, so `anchor.y` keeps its staged meaning and level terrain yields zero relief; it relies on the record object not being mutated after placement because the anchor height is remembered per object.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional member mixed into the placement and design records, so every placement path receives terrain through the same record instead of a separate parameter some callers could omit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No surface or formation is special-cased; absent terrain, a member off the terrain and an anchor off the terrain all give zero relief as authored facts, not as a fallback for a failed lookup.

## @evidence contracts/development/common.md#meaningful-documentation

States the relief rule, the snapshot's source, what an absent or empty list means, the zero-relief cases, and the immutability requirement that follows from the per-record cache.
