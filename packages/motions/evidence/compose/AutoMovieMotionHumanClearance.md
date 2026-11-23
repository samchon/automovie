# src/compose/AutoMovieMotionHumanClearance.ts#AutoMovieMotionHumanClearance.path

## @evidence contracts/development/common.md#meaningful-documentation

States the ends, the required height and what the returned function reads.

## @evidence contracts/development/implementation.md#principled-implementation

The upper convex hull of the sampled profile and the two ends by a monotone chain, each corner replaced by a quadratic Bezier arc, read by arc length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sample, hull, round, measure, then one lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A step with no length is the straight line between its ends; the sampling spacing and the radius are named.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the samples to build; a binary search per read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The path is built once and read at every instant of the swing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the rounded polyline and its lengths, a few dozen points.

# src/compose/AutoMovieMotionHumanClearance.ts#AutoMovieMotionHumanClearance.IPath

## @evidence contracts/development/common.md#meaningful-documentation

States the reader and the accessor.

## @evidence contracts/development/design.md#principled-representation

The path's own arc-length parameter for both.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The point reader the swings read and the lift share a departure hold reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both read the one built polyline.

# src/compose/AutoMovieMotionHumanClearance.ts#AutoMovieMotionHumanClearance.IPath.lifted

## @evidence contracts/development/common.md#meaningful-documentation

States the unit of the height, the arc-length share returned, the interpolation and both fallbacks to 1.

## @evidence contracts/development/implementation.md#principled-implementation

Heights along each straight piece vary linearly with its arc length, so linear interpolation within the first piece whose end reaches the height gives the exact first share on the built polyline.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Built with the point reader over the same polyline and cumulative lengths, so the two never disagree on the path.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case beyond the stated fallbacks; a flat piece takes its start share instead of dividing by zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward walk, linear in the polyline's points, stopping at the first piece that reaches the height.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the polyline and cumulative arc lengths the path built once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing per call; the path retains its polyline and lengths for its own lifetime.
