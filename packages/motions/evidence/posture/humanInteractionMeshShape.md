# src/posture/humanInteractionMeshShape.ts#humanInteractionMeshShape

## @evidence contracts/development/common.md#meaningful-documentation

States the propagation, the preserved centroid and the undefined cases.

## @evidence contracts/development/implementation.md#principled-implementation

A breadth-first walk from the first point lays each bone at its target length along its reference direction and each contact at its offset; the translation then restores the reference centroid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Edges, one walk, one centroid shift.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A mesh the edges do not connect, or a bone of no length, is refused instead of laid.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in points and edges.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array.
