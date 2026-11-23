# src/motion/MotionTrajectoryPartition.ts#MotionTrajectoryPartition

## @evidence contracts/development/implementation.md#principled-implementation

Reuses an adaptive mesh, not a trajectory: every new trial evaluates its own Runge-Kutta stages and error estimates, and any failed interval receives a strict midpoint refinement. Midpoint failure reports time resolution to the stepper rather than accepting an unresolved interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A map from exact interval starts to their current ends serves lookup and midpoint replacement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There is no rounded time, fixed grid, guessed rate, iteration cap or reused physical verdict. Existing finer intervals are conservative starting proposals, not evidence of accuracy for a different momentum.

## @evidence contracts/development/implementation.md#efficient-algorithms

Expected constant-time interval lookup; refinement takes ceil(log2(old duration / recommended duration)) midpoint splits, at most three for the current controller's fivefold maximum reduction. Storage follows the finest partition encountered without a fixed bound. Reusing an over-refined mesh can cost more stages and needs end-to-end qualification.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only numeric time boundaries are shared within the caller's one history epoch; state, sensitivities and all acceptance checks are recomputed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns one map for its shooting operation, clears it in finally and never transfers it into completed playback. The map retains no physical history, callbacks or states.

## @evidence contracts/development/common.md#meaningful-documentation

States exact endpoint reuse, controller proposals, bisection and unchanged per-trial admission.
