# src/motion/human/handling/IAutoMovieMotionHumanReceive.ts#IAutoMovieMotionHumanReceive.IParams

## @evidence contracts/development/common.md#meaningful-documentation

hand: The receiver's taking hand; `right` when absent. giverHand: The giver's holding hand; `right` when absent. mass: The prop's mass, kilograms; 0.09 when absent.

## @evidence contracts/development/design.md#principled-representation

hand: The receiver's taking hand; `right` when absent. giverHand: The giver's holding hand; `right` when absent. mass: The prop's mass, kilograms; 0.09 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.receive, params); handling/receive.ts (receive.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanHandover.Outcome identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
