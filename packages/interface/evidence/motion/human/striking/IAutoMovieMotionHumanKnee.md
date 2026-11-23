# src/motion/human/striking/IAutoMovieMotionHumanKnee.ts#IAutoMovieMotionHumanKnee.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The interface's motion target and a closed union of legs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the plan and the kickboxing rules read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's target union.

# src/motion/human/striking/IAutoMovieMotionHumanKnee.ts#IAutoMovieMotionHumanKnee.Leg

## @evidence contracts/development/common.md#meaningful-documentation

Names the two legs by the stance.

## @evidence contracts/development/design.md#principled-representation

A closed union of the stance's two legs, so no other leg type-checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the knee law's `leg` member and by the strike family's knee presets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit literals; the stance owns which physical leg each names.
