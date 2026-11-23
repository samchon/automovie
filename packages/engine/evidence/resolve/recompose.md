# src/resolve/recompose.ts#recompose

## @evidence contracts/development/implementation.md#principled-implementation

Walk supplied descendants, compose their admitted local TRS and multiply updated parent matrices recursively, preserving full-matrix composition shear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Child indexing and required-map readers separate graph/lookup admission from this world-map mutation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing local state throws; stale/cyclic adjacency and deep recursion remain caller/stack limitations rather than silently repaired topology.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state descendant-only mutation and borrowed local/topology maps; later failure may leave earlier descendants updated.

## @evidence contracts/development/implementation.md#efficient-algorithms

S descendants require O(S) fixed-size matrix work/replacements and O(H) recursion stack for depth H.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One frame's local/child maps serve all drivers; changed ancestors invalidate descendant matrices and require recomposition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns replacements/maps and temporary locals/stack release on return or failure, with no host graph handle or worker.
