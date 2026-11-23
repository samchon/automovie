# src/motion/human/reaction/IAutoMovieMotionHumanStagger.ts#IAutoMovieMotionHumanStagger

## @evidence contracts/development/common.md#meaningful-documentation

target: Where the blow comes target: the body is pushed away from it; a place ahead of the performer when absent.

## @evidence contracts/development/design.md#principled-representation

target: Where the blow comes target: the body is pushed away from it; a place ahead of the performer when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.stagger, params); reaction/stagger.ts (stagger.plan, context); reaction/stagger.ts (stagger.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/reaction/IAutoMovieMotionHumanStagger.ts#IAutoMovieMotionHumanStagger.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the blow's target and its default, the push's direction, the speed's unit and what the manner changes.

## @evidence contracts/development/design.md#principled-representation

The blow is the interface's motion-target union, the speed metres per second, checked positive and capturable when planning, and the manner the shared manner record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's target union and the shared manner.
