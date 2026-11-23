# src/geometry/construction/AutoMovieSolidMeshIncidence.ts#AutoMovieSolidMeshIncidence.walks

## @evidence contracts/development/implementation.md#principled-implementation

Sorts outgoing halfedges around each source, follows the predecessor of the twin at each target and accumulates the represented cover turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One result union returns all walks or the named finite/subdivision premise that failed, without mutating the graph.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing points, unrepresentable lifts, zero spans or duplicate outgoing directions fail explicitly; no branch, hole or edge is dropped to close a walk.

## @evidence contracts/development/common.md#meaningful-documentation

Documents that input must already be split and output is boundary incidence rather than kept-face triangulation.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(V+E+sum(d log d)) work and linear storage; the position table makes each successor lookup constant-time after sorting.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses lifted endpoints, angular lists and twin positions rather than rebuilding them for each walk.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All traversal maps/bitmaps expire on return; only fresh walk arrays escape, with no shared cache.
