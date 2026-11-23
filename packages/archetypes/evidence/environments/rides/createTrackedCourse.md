# src/environments/index.ts#createTrackedCourse

## @evidence contracts/development/implementation.md#principled-implementation

The engine supplies the centripetal spline and double-reflection transport. A closed spline uses the same seam tangent at both ends and apportions its measured residual twist, after which bank is a rotation about the tangent. A fixed chord sum and a binary inverse form an approximate metric station clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare and sample the spine once, then invert the station table to find each frame and apply its two local rotations as one bank.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing lateral uses the world up cross the tangent except on a vertical tangent, where +X is the declared starting axis. Supplied malformed axes and vanishing or unrepresentable intervals refuse. Stations approximate spline arclength and each adjacent authored bank change must be at most a half turn.

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, output frame, source of its approximation, closure correction and refused cases.

## @evidence contracts/development/implementation.md#efficient-algorithms

One constant-density sample table per spline span; sampled path calls use the engine's linear span search. A distance lookup is logarithmic in those samples plus a frame query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Retains one transport and one station table for all geometry and timing queries of this course.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only linear-size spline and station data, no history of queries or external resources.
