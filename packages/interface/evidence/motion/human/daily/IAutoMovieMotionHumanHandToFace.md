# src/motion/human/daily/IAutoMovieMotionHumanHandToFace.ts#IAutoMovieMotionHumanHandToFace

## @evidence contracts/development/common.md#meaningful-documentation

hand: The hand of a one-hand task; `right` when absent. count: Repetitions at the face; the row's when absent. hold: Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#principled-representation

hand: The hand of a one-hand task; `right` when absent. count: Repetitions at the face; the row's when absent. hold: Seconds at the face after the repetitions, or two bounds the seed draws them between, evenly (a puff on a cigarette lasts 1.6 to 2.1 s); the row's when absent. Inclusive minimum: 0. Unit: "s".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainManual.ts (HumanChainManual.handToFace, params); daily/handToFace.ts (handToFace.plan, context); daily/handToFace.ts (handToFace.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHandToFaceRows.Task, IAutoMovieMotionHumanHandToFaceRows.IRow, AutoMovieHumanSide, IAutoMovieMotionHumanHeldUse.IGrasp, IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/daily/IAutoMovieMotionHumanHandToFace.ts#IAutoMovieMotionHumanHandToFace.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The task by name, the hand, the repetitions and the time at the face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The row supplies every default.
