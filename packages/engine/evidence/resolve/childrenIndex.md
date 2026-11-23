# src/resolve/childrenIndex.ts#childrenIndex

## @evidence contracts/development/implementation.md#principled-implementation

Group each non-root node id under its declared parent, preserving input sibling order; composeScene separately admits unique ids and valid acyclic parent references.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One adjacency index supports descendant recomposition without rescanning the full node list for every visited parent.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No inferred parent or fixture ordering is introduced; standalone indexing does not prove graph validity.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify parent-to-children direction, staging-order preservation and root omission.

## @evidence contracts/development/implementation.md#efficient-algorithms

N nodes require O(N) traversal and O(N) child references plus one entry per represented parent.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

resolveFrame builds one adjacency map for all world drivers in that frame; changed parent/id topology requires rebuilding.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh map/arrays and borrowed id strings; no source node records, traversal task or host handle is retained.
