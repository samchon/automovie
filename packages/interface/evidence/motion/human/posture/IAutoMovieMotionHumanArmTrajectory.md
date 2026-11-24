# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.Trajectory

## @evidence contracts/development/common.md#meaningful-documentation

An arm at any second of the span.

## @evidence contracts/development/design.md#principled-representation

One action-relative second maps to the arm-clearance pose produced by the trajectory solver; interpolation and refusal remain with that solver rather than a duplicated pose representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carried.planned, return); compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower, plan); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned, return); everyday/gestureHands.ts (gestureHands.planned, return); everyday/gestureHands.ts (gestureHands.written, arms); posture/HumanArmTrajectory.ts (HumanArmTrajectory.solve, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmClearance.IArm identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.IPlayed

## @evidence contracts/development/common.md#meaningful-documentation

States that the arm's joints and the hand's digit joints are written unchanged, in clinical degrees by bone, and that a digit with no carried state is absent.

## @evidence contracts/development/design.md#principled-representation

A planned arm and its hand's finger state in joint space, the pair MoveIt's grasp carries (moveit_msgs/Grasp, BSD-3-Clause: grasp_pose with grasp_posture) for execution to play, so the hand the display shows is the hand the planner read; the digit record is the posture's own joint record, so no second angle representation exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned) and written by compose/AutoMovieMotionHumanArmPlayed.ts (AutoMovieMotionHumanArmPlayed.written) for AutoMovieMotionHumanArmCarry, AutoMovieMotionHumanSharedCarry and gestureHands.written; extends the arm-clearance arm with only the finger state those writers read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends IAutoMovieMotionHumanArmClearance.IArm instead of copying it, and reuses IAutoMovieMotionHumanPosture's joint record; the digits are required, an empty record where the plan carries none.

# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.Played

## @evidence contracts/development/common.md#meaningful-documentation

A planned arm and its hand's finger state at any second of the span, the span's own clock.

## @evidence contracts/development/design.md#principled-representation

One action-relative second maps to the played arm (`IPlayed`): the solver's trajectory and the finger state its bases carried, so a trajectory and its hand never come apart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieMotionHumanArmPlanned.planned and gestureHands.planned, held by IAutoMovieMotionHumanArmPlanned.ITogether.solved, read by AutoMovieMotionHumanArmCarry, AutoMovieMotionHumanSharedCarry, gestureHands.written, gesture and brace; it is assignable where a Trajectory is read (AutoMovieMotionHumanArmFollow, certifyHumanArmTracks).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A subtype of Trajectory's result, so every arm-only reader keeps its signature.
# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.IState

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning, frame and what the record is for.

## @evidence contracts/development/design.md#principled-representation

The knots' seconds, each arm's coordinates at each knot in the frame the problem was solved in (its mirror image for a left-first problem), and the penalty reached, the three things a penalty method's continuation needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `solve` and taken back by `solve`; a holder passes it on unread.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No verdict is carried: a state is only a start, admitted anew by the solve that takes it.

# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.IPlayed

## @evidence contracts/development/common.md#meaningful-documentation

States what a planned arm carries at a second and that the display writes it unchanged.

## @evidence contracts/development/design.md#principled-representation

The arm's joints with its hand's finger state in joint space, as MoveIt's grasp carries its finger state (`moveit_msgs/Grasp`, `grasp_posture`) for execution to play.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member over the arm it extends: the digits, keyed by bone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A digit with no planned state is absent, never a zero pose.

# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory.Played

## @evidence contracts/development/common.md#meaningful-documentation

States what it returns at a second.

## @evidence contracts/development/design.md#principled-representation

A planned arm as a function of the span's second, the played form of a trajectory.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One reader per planned arm, written by the arm planner and read by the arm's carriers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The finger state rides the same reader as the arm, so no second clock plays it.