# src/motion/human/compose/IAutoMovieMotionHumanVariation.ts#IAutoMovieMotionHumanVariation.ISource

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member states its range or its key.

## @evidence contracts/development/design.md#principled-representation

The three things a spread and a draw need: the skill that sets the spread, the factor on it and the action's seeded series.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, built by `of` and read by every slot function.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A source exists only when variation is positive, so "no variation" is the absent source and no function tests a zero.

# src/motion/human/compose/IAutoMovieMotionHumanVariation.ts#IAutoMovieMotionHumanVariation.ITangent

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and each member's unit and direction.

## @evidence contracts/development/design.md#principled-representation

Two tangent coordinates in the region's own frame, which the engine puts back on the body's surface; depth is the contact owner's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members; returned by `strike` and read by the region's placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No normal component, so an offset can never lift a strike off the surface.

# src/motion/human/compose/IAutoMovieMotionHumanVariation.ts#IAutoMovieMotionHumanVariation.IStrike

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and its value when absent.

## @evidence contracts/development/design.md#principled-representation

The region's radius bounds the point and scales the intent; the weapon's end point scatter and its direction on the tangent plane give the miss.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members read by `strike`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The radius is derived from the body by its owner and passed in, never typed here.

# src/motion/human/compose/IAutoMovieMotionHumanVariation.ts#IAutoMovieMotionHumanVariation.IReport

## @evidence contracts/development/common.md#meaningful-documentation

count: How many seeds were read. mean: The mean. deviation: The standard deviation (population).

## @evidence contracts/development/design.md#principled-representation

count: How many seeds were read. mean: The mean. deviation: The standard deviation (population).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVariation.ts (HumanVariation.over, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanVariation.over.
