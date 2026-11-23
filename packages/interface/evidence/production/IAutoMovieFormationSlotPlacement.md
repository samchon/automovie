# src/production/IAutoMovieFormationSlotPlacement.ts#IAutoMovieFormationSlotPlacement

## @evidence contracts/development/design.md#principled-representation

Composition order is fixed: the unit's sampled transform first, then the member's own offset rotated by the unit's current heading, so a member cue displaces inside the unit frame and turning the unit carries the offset with it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three fields every consumer needs, presence, world position and heading, produced by `placeFormationSlot` so the ground gate, the overlap gate and geometry measurement read one composition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent member keeps a computed position instead of a sentinel, so no consumer needs a special branch to read it, and the heading is left unwrapped rather than normalized for one consumer's range.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its readers, that an absent member still has a position, the world-space meter and degree units, the composition order, and that the heading is not wrapped.
