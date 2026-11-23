# src/math/transformedBoxBounds.ts#transformedBoxBounds

## @evidence contracts/development/implementation.md#principled-implementation

The affine image of a box is the convex hull of its eight transformed corners, so their per-axis minimum and maximum is the exact axis-aligned bound; each corner is the column-major product `M·p` with the implicit `w = 1`, the layout `Matrix4.compose` writes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One box transform shared by the prop occupancy and clearance queries, which each carried a corner list, a point transform and a bounds fold of their own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every box and matrix is handled the same way with no shortcut for an identity or axis-aligned rotation, so the answer never depends on which transform happened to be passed.

## @evidence contracts/development/common.md#meaningful-documentation

States that all corners are transformed and why that widens a rotated box, the ordered result under a mirror, the matrix layout, that the last row is ignored, and the `NaN` propagation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and space: eight corner products folded directly into the running bound without building a corner or point array.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one box and one matrix that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the running bound while folding; neither the local box nor the matrix is referenced by the result the caller receives.
