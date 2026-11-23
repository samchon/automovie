# src/motion/human/floor/IAutoMovieMotionHumanDive.ts#IAutoMovieMotionHumanDive.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The kinds.

## @evidence contracts/development/design.md#principled-representation

Closed choices "dive", "slide" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: floor/dive.ts (dive.SHAPES); floor/dive.ts (dive.REACH); floor/dive.ts (dive.TURN); floor/dive.ts (dive.PHASES); floor/dive.ts (dive.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in dive.SHAPES.

# src/motion/human/floor/IAutoMovieMotionHumanDive.ts#IAutoMovieMotionHumanDive.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The kind and, for a dive, its side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed unions.
