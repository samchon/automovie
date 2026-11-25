# src/geometry/curve/AutoMovieContourSlit64.ts#AutoMovieContourSlit64.join

## @evidence contracts/development/implementation.md#principled-implementation

Endpoint projections and the interior segment-pair solution locate a continuous closest slit; oriented boundary walks traverse it in opposite directions. Exact endpoint parameters reuse the existing endpoint object and its cyclic incidence instead of inserting a zero-length walk edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

N by M segment pairs are examined once; the returned joined walk has O(N+M) points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.

# src/geometry/curve/AutoMovieContourSlit64.ts#AutoMovieContourSlit64.closest

## @evidence contracts/development/implementation.md#principled-implementation

Clamped orthogonal projection gives the nearest point of a finite segment, retaining its endpoint for zero length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of three-component dot products and affine operations is used.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.
