# src/motion/human/reaction/IAutoMovieMotionHumanKnockdown.ts#IAutoMovieMotionHumanKnockdown

## @evidence contracts/development/common.md#meaningful-documentation

target: Where the blow came from; a place ahead of the performer when absent. hold: How long the body lies after landing, seconds; 1 when absent.

## @evidence contracts/development/design.md#principled-representation

target: Where the blow came from; a place ahead of the performer when absent. hold: How long the body lies after landing, seconds; 1 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.knockdown, params); reaction/knockdown.ts (knockdown.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/reaction/IAutoMovieMotionHumanKnockdown.ts#IAutoMovieMotionHumanKnockdown.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the blow's target and the lying time's unit and default.

## @evidence contracts/development/design.md#principled-representation

The blow is the interface's motion-target union and the lying time seconds, checked non-negative when planning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's target union.
