# src/motion/human/compose/IAutoMovieMotionHumanClearance.ts#IAutoMovieMotionHumanClearance

## @evidence contracts/development/common.md#meaningful-documentation

z: Distance along the step, metres. y: Height, metres.

## @evidence contracts/development/design.md#principled-representation

z: Distance along the step, metres. y: Height, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path, from); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path, to); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path, return); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path.p, return); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.toward, a); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.toward, b).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanClearance.path.

# src/motion/human/compose/IAutoMovieMotionHumanClearance.ts#IAutoMovieMotionHumanClearance.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its axis and unit.

## @evidence contracts/development/design.md#principled-representation

Two coordinates of the plane the foot moves in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by `path`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain numbers.
