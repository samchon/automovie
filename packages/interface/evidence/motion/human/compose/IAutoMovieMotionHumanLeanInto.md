# src/motion/human/compose/IAutoMovieMotionHumanLeanInto.ts#IAutoMovieMotionHumanLeanInto

## @evidence contracts/development/common.md#meaningful-documentation

share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres. arm: The working arm's goal on a posture at the stroke's start, so the balance weighs the arm where it reaches; the arm as the posture holds it when absent.

## @evidence contracts/development/design.md#principled-representation

share: The share of the arm's length (upper arm and forearm) the wrist is kept within. wrist: The wrist's goal on a posture at a progress of the stroke in [0, 1], world metres. arm: The working arm's goal on a posture at the stroke's start, so the balance weighs the arm where it reaches; the arm as the posture holds it when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanLeanInto.ts (AutoMovieMotionHumanLeanInto.solve, return); compose/AutoMovieMotionHumanLeanInto.ts (AutoMovieMotionHumanLeanInto.solve, props); affordance/operate.ts (operate.plan); compose/AutoMovieMotionHumanTouchStance.ts (AutoMovieMotionHumanTouchStance.solve); tasks/wipe.ts (wipe.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, AutoMovieHumanSide, IAutoMovieVector3, IAutoMovieHumanLimbGoal, IAutoMovieMotionClock identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanLeanInto.ts#IAutoMovieMotionHumanLeanInto.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The body, the posture it stands in, the arm, the share of its length kept, the wrist's goal and the arm's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven members, all read by `solve`; the arm's goal is optional because a caller with only a wrist point has no arm to weigh.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The refusal's words are the caller's, which knows what is out of reach.

# src/motion/human/compose/IAutoMovieMotionHumanLeanInto.ts#IAutoMovieMotionHumanLeanInto.ILean

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it returns and its unit.

## @evidence contracts/development/design.md#principled-representation

The pitch and the posture it gives, the two things a law reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pitch is read on the posture given, so a moved root is followed.
