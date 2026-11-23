# src/geometry/sweep/measureAutoMovieSweepVolume.ts#measureAutoMovieSweepVolume

## @evidence contracts/development/implementation.md#principled-implementation

The normal flux of a moving planar section, which is the swept-volume formula of sweep-based deformation plus the first-moment terms an off-centre section adds, integrated by the midpoint rule; its premise, a sweep without self-intersection, is stated.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the compiled surface's frames, shape and scale, so the same definition is both rendered and measured, through the two steps posing shares.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No correction is applied for crossing sections; the premise is documented instead.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula and its sources, the quadrature, the unit and the self-intersection premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(400 * 256) profile queries, each a cached-row read for a surface without features, plus 801 frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure measurement; the surface's row cache is the reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
