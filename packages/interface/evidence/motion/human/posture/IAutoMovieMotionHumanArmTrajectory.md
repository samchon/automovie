# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.Trajectory

## @evidence contracts/development/common.md#meaningful-documentation

An arm at any second of the span.

## @evidence contracts/development/design.md#principled-representation

One action-relative second maps to the arm-clearance pose produced by the trajectory solver; interpolation and refusal remain with that solver rather than a duplicated pose representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carried.planned, return); compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower, plan); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned, return); everyday/gestureHands.ts (gestureHands.planned, return); everyday/gestureHands.ts (gestureHands.written, arms); posture/HumanArmTrajectory.ts (HumanArmTrajectory.solve, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmClearance.IArm identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.IState

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning, frame and what the record is for.

## @evidence contracts/development/design.md#principled-representation

The knots' seconds, each arm's coordinates at each knot in the frame the problem was solved in (its mirror image for a left-first problem), and the penalty reached, the three things a penalty method's continuation needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `solve` and taken back by `solve`; a holder passes it on unread.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No verdict is carried: a state is only a start, admitted anew by the solve that takes it.
