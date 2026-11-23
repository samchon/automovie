# src/drawing/transformAutoMovieDrawingTriangles.ts#transformAutoMovieDrawingTriangles

## @evidence contracts/development/implementation.md#principled-implementation

Applies the affine transform to each corner and keeps corner order, which preserves the right-hand winding for any orientation-preserving matrix; the mirrored case is stated as a limitation rather than corrected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A list form of `transformAutoMovieDrawingPoint` shared by element placement, opening fills and feature resolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No triangle or matrix is special-cased, and a mirroring matrix is not silently re-wound.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the matrix layout, the order and winding guarantee, the mirroring limitation and the frames.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `t` triangles with constant work each, linear time and one output triangle per input.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function; reuse of the untransformed tessellation happens in `indexAutoMovieDrawingDesign`, which caches the input this function places.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each placed triangle belongs to the returned list the caller owns; the source list is only read and never retained.
