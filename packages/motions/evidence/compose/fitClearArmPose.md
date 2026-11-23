# src/compose/fitClearArmPose.ts#fitClearArmPose

## @evidence contracts/development/common.md#meaningful-documentation

States what is judged, by whom, why the span holds from its start or is reached, what seeds it, where the answer is read and who searches on it.

## @evidence contracts/development/implementation.md#principled-implementation

The clearance verdict is the arm planner's own (`courseArmGoal`, `HumanArmTrajectory`), the same that lays the action's course, so a pose found clear here is laid by the action the same way; a hold from the first instant is joined to its rest without a reach (`AutoMovieMotionHumanArmPlanned`), so the verdict is the pose's alone; a stated reach is the action's own, its pace the minimum-jerk peak, 15/8 of the mean speed over the distance it covers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One limb fit for the seed, one constant plan, one course, one read at the span's end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the planner's refusal is the verdict "refused"; every other error propagates, and the goal is never loosened.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve and one course of a one-step hold per call, or one reached course and one forward kinematics of the entry's wrists.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the seed to `resolveHumanPosture`, the solve to `courseArmGoal` and the rest angles to `AutoMovieMotionHumanArm.angles`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the call but the coursed posture it returns.
