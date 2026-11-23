# src/drawing/transformAutoMovieDrawingPoint.ts#transformAutoMovieDrawingPoint

## @evidence contracts/development/implementation.md#principled-implementation

The affine transform `M * (x, y, z, 1)` written out over a column-major layout, exact up to rounding for the TRS matrices the engine composes; dropping the projective row is valid because those matrices have `(0, 0, 0, 1)` there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One point transform the part, triangle and feature placements share, written without a temporary vector because it runs once per mesh corner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No matrix is special-cased; the affine premise is stated rather than checked because every producer is `Matrix4.compose` or a product of its results.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the layout, where the translation lives, the affine premise and why it holds, and the output frame.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Nine multiplications and nine additions, so there is no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Eighteen arithmetic operations per corner; the reusable unit is a part tessellation, which the design index already caches upstream.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Reads the matrix without keeping a reference and hands the new corner to the triangle or feature that requested it.
