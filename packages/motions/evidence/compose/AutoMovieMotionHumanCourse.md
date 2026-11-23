# src/compose/AutoMovieMotionHumanCourse.ts#AutoMovieMotionHumanCourse.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the result, its clamping and the span of no length; the namespace gives the law.

## @evidence contracts/development/implementation.md#principled-implementation

The extrapolated centre of mass condition integrated exactly per step for a held target, the hips placed on the solved posture's centre by fixed-point corrections, read back by a Catmull-Rom cubic through the knots.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One synchronous metadata scope owns the knot loop; only numeric knots, count and step leave it for the interpolating closure.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The correction assumes the centre follows the hips one to one and repeats, so a leg that reconfigures is absorbed by the next correction and not by a typed gain. A span of no length has no step to interpolate across and holds its one place instead of dividing by zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

One complete posture solve at the start and CORRECTIONS complete solves per knot, 48 knots per second. A fixed mass-name reader prepares once and shares exact FK and static ROM prerequisites across every correction; each read is constant work on four knots.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each knot starts from the previous place and the centre's step. Unchanged body, profile and rig fix the mass demand and ROM metadata; the posture builder may borrow the synchronous FK source for its hip observation, while every joint, limb and digit fit and mass placement is evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Construction releases its FK, name and ROM sources and posed maps on return or throw. The returned cubic retains one scalar per knot, the count, the step and the start second; no posture callback, body or solved pose enters it.
