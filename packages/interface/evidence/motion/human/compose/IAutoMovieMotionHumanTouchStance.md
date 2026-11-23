# src/motion/human/compose/IAutoMovieMotionHumanTouchStance.ts#IAutoMovieMotionHumanTouchStance

## @evidence contracts/development/common.md#meaningful-documentation

feet: Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.

## @evidence contracts/development/design.md#principled-representation

feet: Both feet as they stand flat, when the body stands on them alone and may rise onto its toes; no rise when absent. share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanTouchStance.ts (AutoMovieMotionHumanTouchStance.solve, props); compose/AutoMovieMotionHumanTouchStance.ts (AutoMovieMotionHumanTouchStance.solve, return); touch/touch.ts (touch.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRise.Stance, AutoMovieHumanSide, IAutoMovieVector3, IAutoMovieHumanLimbGoal identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanTouchStance.ts#IAutoMovieMotionHumanTouchStance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and the meaning of its absence.

## @evidence contracts/development/design.md#principled-representation

The body, the posture it stands in, the feet it may rise on, the arm, the share of its length kept and the wrist's goal.

## @evidence contracts/development/design.md#minimal-and-owned-surface `solve` reads the stance inputs and shares the arm's goal with the lean.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The feet are optional because a seated or carried body has none to rise on; the refusal's words are the caller's.

# src/motion/human/compose/IAutoMovieMotionHumanTouchStance.ts#IAutoMovieMotionHumanTouchStance.IStance

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it holds and its unit.

## @evidence contracts/development/design.md#principled-representation

The girdle and heel angles, whether the trunk leans, the posture at the full rise and the primitives that perform them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members; the touch law reads the lean, the risen and the reached postures and the primitives, and its tests the two angles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The primitives are built on the caller's clock, so the body moves on the hand's envelope.

# src/motion/human/compose/IAutoMovieMotionHumanTouchStance.ts#IAutoMovieMotionHumanTouchStance.ICorrection

## @evidence contracts/development/common.md#meaningful-documentation

The stance declares the channel and runs the writer on its current posture before the arm reaches.

## @evidence contracts/development/design.md#principled-representation

The channel identifies the changed component. The writer accepts the existing primitive time and posture arguments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The touch prepares the correction and the stance incorporates it in its writer. The arm reads the resulting pose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The canonical primitive writer signature preserves resolution inputs without retaining sampled poses.
