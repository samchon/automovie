# src/motion/human/exercise/IAutoMovieMotionHumanJuggle.ts#IAutoMovieMotionHumanJuggle.Pattern

## @evidence contracts/development/common.md#meaningful-documentation

The patterns' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "cascade", "shower".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/juggle.ts (juggle.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanJuggle.ts#IAutoMovieMotionHumanJuggle.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit, range and default, and the height states how the flight and holds follow from it.

## @evidence contracts/development/design.md#principled-representation

The pattern, the balls by scene id in hand order, the throw height in metres, the throw count and the dropped throws by one-based count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members juggle.plan reads; the timing is derived from the height by Shannon's theorem, not supplied.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ball count each pattern admits and a too-short vacancy are not encoded in the type and remain for juggle.plan's runtime refusals.
