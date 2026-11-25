# src/compose/AutoMovieMotionHumanArmFollow.ts#AutoMovieMotionHumanArmFollow.follower

## @evidence contracts/development/common.md#meaningful-documentation

States the start, the step, its two bounds, the release after the hold and how a second between frames is read.

## @evidence contracts/development/implementation.md#principled-implementation

Error-driven feedback on a feed-forward plan by differential inverse kinematics (damped least squares), rate-limited by the plan's own pace and kept by the planner's own clearance reading (`HumanArmTrajectoryModel.invalid`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One grid filled in order; per frame one error, one Jacobian, one step, its two bounds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero error gives a zero step, not a small one; the correction is never moved faster than the bound to catch up, and starts and ends at zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per grid frame of the hold: two goal reads, one frame, the Jacobian's forward placements (two per free coordinate) and a three-by-three solve, none when the goal has not moved, and one clearance reading per trial step, the last of which the final test reuses; a frame whose correction is still zero reads nothing at all when the carry has no perceived goal (its two goal reads are one callback, premised deterministic; a goal that would throw at such a frame is then not read and no longer throws there) or the hold is over.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses moved/differential/geometry/model owners and one fixed same-body/side context builder. Each actual step lends its FK/genuine ROM metadata through before and both goal observations, optionally borrowing the current caller's metadata; all times, frames, goals and clearance queries remain actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function keeps the original numeric correction grid plus fixed body/side setup readers until release. Query metadata enters as invocation arguments, ends with that invocation and is never assigned to a retained cell or returned context; no query pose or new time-result history enters the prepared context builder.
