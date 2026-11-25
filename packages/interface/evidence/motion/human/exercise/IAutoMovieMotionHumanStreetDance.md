# src/motion/human/exercise/IAutoMovieMotionHumanStreetDance.ts#IAutoMovieMotionHumanStreetDance.Groove

## @evidence contracts/development/common.md#meaningful-documentation

The grooves' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "rock", "moonwalk".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/streetDance.ts (streetDance.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanStreetDance.ts#IAutoMovieMotionHumanStreetDance.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit, range and default.

## @evidence contracts/development/design.md#principled-representation

The groove, the tempo in beats per minute, the beat count, the hits in quarter beats from the first beat, the timing variation in seconds and the first sliding foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members streetDance.plan reads; `lock` reuses the dance law's own type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One record rather than a union on `groove`: `hits` serves only the rock and `side` only the moonwalk, and the other groove leaves them unused.
