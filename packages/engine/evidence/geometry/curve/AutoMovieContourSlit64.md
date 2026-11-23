# src/geometry/curve/AutoMovieContourSlit64.ts#AutoMovieContourSlit64

## @evidence contracts/development/common.md#meaningful-documentation

States its ownership boundary, unchanged numerical contract and caller-owned inputs.

## @evidence contracts/development/design.md#principled-representation

Represents Continuous closest-segment slit construction for declared contour walks: companion namespace of 2 members (`join`, `closest`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieContourSlit64` in packages/engine/src/geometry/curve/AutoMovieContourSlit64.ts; its surface is the 2 members listed and the text shows 1 other file naming it, mostly packages/engine (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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
