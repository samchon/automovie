# src/motion/human/touch/IAutoMovieMotionHumanLegTouch.ts#IAutoMovieMotionHumanLegTouch.With

## @evidence contracts/development/common.md#meaningful-documentation

The part of the leg that touches.

## @evidence contracts/development/design.md#principled-representation

Closed choices "toes", "heel", "knee" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: touch/legTouch.ts (legTouch.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in legTouch.plan.

# src/motion/human/touch/IAutoMovieMotionHumanLegTouch.ts#IAutoMovieMotionHumanLegTouch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

The place as the shared target union, the part as a closed union, the hold in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the target union.
