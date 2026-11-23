# src/drawing/clipAutoMovieDrawingTriangles.ts#clipAutoMovieDrawingTriangles

## @evidence contracts/development/implementation.md#principled-implementation

Sutherland-Hodgman clipping of each triangle by one plane, which is exact for a convex polygon and a half-space and keeps corner order, so the fan from the first kept corner preserves the right-hand winding the silhouette pass reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the half-space clip of a soup and shares the plane distance with cut extraction, so both agree on which side a corner is.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No triangle or element is special-cased; on-plane corners are kept by the shared tolerance, and the duplicate in-plane silhouette is removed by the caller's stated rule rather than here.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states which side is kept, the tolerance, the re-fanning and winding preservation, and how in-plane edges are treated downstream.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `t` triangles with constant work each, emitting at most three triangles per input, the third only when a corner within tolerance of the plane also contributes a crossing point, so time and output are linear in `t`; every triangle must be visited because any may straddle the plane.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function called once per drawable and role per derivation; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each triangle's clipped polygon is a temporary; only the returned array, owned by the caller, survives.
