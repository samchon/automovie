# src/geometry/sweep/rigAutoMovieSurfaceCurve.ts#rigAutoMovieSurfaceCurve

## @evidence contracts/development/implementation.md#principled-implementation

A centripetal Catmull-Rom curve through moved control points with tangent-plane end conditions at sweeps, so patches bounded by it can meet the sweep with one tangent plane.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The spline is `transportAutoMovieSweepSpine` without frames; this function only gathers control points and end conditions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A curve whose spline meets a sweep along its normal is refused instead of being given an arbitrary tangent.

## @evidence contracts/development/common.md#meaningful-documentation

States the spline, the end rule, both bridge rules and what rides the bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n control points: `update` writes n points and runs the spline update once, or twice when an end lies on a sweep; each read is a segment search and a cubic; nothing allocates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The spline is updated once per pose and serves every sample of the curve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the spline buffers, 3 n rest points and nine numbers of normal and direction.
