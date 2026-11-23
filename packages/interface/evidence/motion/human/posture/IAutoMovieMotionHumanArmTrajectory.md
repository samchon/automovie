# src/motion/human/posture/IAutoMovieMotionHumanArmTrajectory.ts#IAutoMovieMotionHumanArmTrajectory

## @evidence contracts/development/common.md#meaningful-documentation

A performer's arms over one action as one trajectory optimisation, in TrajOpt's formulation (Schulman et al. 2014, "Motion planning with sequential convex optimization and convex collision checking", IJRR 33:1251): the arms' joint-space waypoints over the reach, the hold and the return are the variables, the objective and the constraints are `HumanArmTrajectoryModel`'s, and the problem is solved by penalty sequential convex optimisation with a trust region (TrajOpt's Algorithm 1, `HumanArmOptimiser`) from a seed whose hold is solved by inverse kinematics and whose reach and return are a sampling planner's clear paths (`HumanArmSeed`), its waypoints refined where they do not bound what lies between them (`HumanArmRefine`). Two arms that move over one span are one problem, their probes kept clear of each other as they both move: planning one after the other is incomplete where their paths are coupled (Erdmann and Lozano-Pérez 1987, Algorithmica 2:477). A problem whose first arm is the left is solved as its mirror image, the arms on the other side, so mirrored scenes give mirrored paths. A problem still infeasible at the last penalty is refused.

## @evidence contracts/development/design.md#principled-representation

A trajectory is an action-second sampler of the canonical arm-clearance pose, shared by the planner and the carried-arm/follower evaluators.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmCarry.ts (AutoMovieMotionHumanArmCarry.carried.planned, return); compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower, plan); compose/AutoMovieMotionHumanArmPlanned.ts (AutoMovieMotionHumanArmPlanned.planned, return); everyday/gestureHands.ts (gestureHands.planned, return); everyday/gestureHands.ts (gestureHands.written, arms); posture/HumanArmTrajectory.ts (HumanArmTrajectory.solve, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmClearance.IArm identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

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
