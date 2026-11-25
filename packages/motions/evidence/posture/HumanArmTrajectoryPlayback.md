# src/posture/HumanArmTrajectoryPlayback.ts#HumanArmTrajectoryPlayback

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, by which interpolant, the shoulder's one reading, what the reader retains and its behaviour outside the span.

## @evidence contracts/development/implementation.md#principled-implementation

The interpolant is the one the trajectory is admitted on (`HumanArmTrajectoryAdmission`), so what is played is what was read; the shoulder's reading is continued knot by knot from the first, a pure function of the knots, so a second reads the same whatever was read before it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private coordinate curve supplies both the exact coordinates and preceding knot for branch selection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pose is stored: every second is interpolated and decoded; the readings kept are the knots' own, never a queried second's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One interval lookup supplies the Hermite segment and shoulder chart together. Actual knot differences and spans are prepared once, and the knot charts are decoded once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A solved trajectory and a laid course are played by this one reader; the knots' readings depend on the knots alone and serve every query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains just the selected setup, a private copy of its knot times and coordinate rows, their Hermite tangents and one chart triple per knot while the reader is held.
