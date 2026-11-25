# src/motion/human/handling/IAutoMovieMotionHumanRegrasp.ts#IAutoMovieMotionHumanRegrasp.IParams

## @evidence contracts/development/common.md#meaningful-documentation

angle: A twist's turn, degrees, counter-clockwise looking down the axis.

## @evidence contracts/development/design.md#principled-representation

angle: A twist's turn, degrees, counter-clockwise looking down the axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/regrasp.ts (regrasp.plan, context); handling/regrasp.ts (regrasp.inHand, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
