# src/geometry/sweep/stencilAutoMovieSubdivisionLimit.ts#stencilAutoMovieSubdivisionLimit

## @evidence contracts/development/implementation.md#principled-implementation

The published limit-point masks of Catmull-Clark subdivision for interior vertices and for crease boundaries.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Topology only: one pass gathers neighbours, a second writes compressed rows, and solving is separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cage with non-quads or non-manifold boundaries is refused instead of being given an approximate mask.

## @evidence contracts/development/common.md#meaningful-documentation

States both masks, their sources and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F) for F quads: four directed edges per face into a map and one row per vertex.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Called once per cage topology; the result is the reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the neighbour sets and edge map are released on return and the rows, O(F), are transferred.
