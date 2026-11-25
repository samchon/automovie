# src/motion/human/lexicon/IAutoMovieMotionHumanCarriedLift.ts#IAutoMovieMotionHumanCarriedLift.IParams

## @evidence contracts/development/common.md#meaningful-documentation

lift: Seconds the lift into the carry takes, at the start; none when absent. Inclusive minimum: 0. Unit: "s". setDown: Seconds the set-down takes, at the end; none when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

lift: Seconds the lift into the carry takes, at the start; none when absent. Inclusive minimum: 0. Unit: "s". setDown: Seconds the set-down takes, at the end; none when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanCarriedLift.ts (HumanCarriedLift.over, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedLift.over.
