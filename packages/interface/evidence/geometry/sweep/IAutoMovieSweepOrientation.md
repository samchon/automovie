# src/geometry/sweep/IAutoMovieSweepOrientation.ts#IAutoMovieSweepOrientation

## @evidence contracts/development/design.md#principled-representation

The station rotations of a sweep held as relative turns over the carried frame, the representation that interpolates between key sections.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two input arrays, one recompile and one query.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `update` reads the transport as it is; a stale transport gives stale frames, so callers update the transport first.

## @evidence contracts/development/common.md#meaningful-documentation

States the call order and what each array holds.
