# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceRows.ts#IAutoMovieMotionHumanHandToFaceRows

## @evidence contracts/development/common.md#meaningful-documentation

region: The region the right hand works on; `null` for a held sheet before the eyes. other: The region the left hand works on at the same time; one hand when absent. hold: Seconds at the face after the repetitions when the parameters give none.

## @evidence contracts/development/design.md#principled-representation

region: The region the right hand works on; `null` for a held sheet before the eyes. other: The region the left hand works on at the same time; one hand when absent. hold: Seconds at the face after the repetitions when the parameters give none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: daily/handToFace.ts (handToFace.ROWS); daily/handToFaceRows.ts (handToFaceRows.ROWS); executable/cases/handToFaceCases.ts (handToFaceCases); daily/handToFace.ts (handToFace.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion, IAutoMovieMotionHumanTouchEffector.IEffector, IAutoMovieMotionHumanTouchForm.Kind, IAutoMovieMotionHumanTouchForm.Tangent identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceRows.ts#IAutoMovieMotionHumanHandToFaceRows.Task

## @evidence contracts/development/common.md#meaningful-documentation

The tasks.

## @evidence contracts/development/design.md#principled-representation

Closed choices "drink", "sip", "eat", "bite", "phone", "read", "brushTeeth", "comb", "washFace", "wipeMouth", "pinchNose" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: daily/handToFace.ts (handToFace.ROWS); daily/handToFaceRows.ts (handToFaceRows.ROWS); executable/cases/handToFaceCases.ts (handToFaceCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in handToFace.ROWS.

# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceRows.ts#IAutoMovieMotionHumanHandToFaceRows.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The touch row's data plus the head's share of the approach.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `plan` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Regions are the interface's; the right hand's region is named and the left hand's mirrored.
