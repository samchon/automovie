# src/validation/validateSkeletonGraph.ts#validateSkeletonGraph

## @evidence contracts/development/implementation.md#principled-implementation

Require one connected root and resolvable acyclic ancestry using declared names, parent edges and traversal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Skeleton graph admission is separate from transform scalar and pose ROM checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid graphs are reported rather than silently attaching detached bones or changing parent links.

## @evidence contracts/development/common.md#meaningful-documentation

Diagnostics identify roots, missing parents and cyclic/disconnected structure.

## @evidence contracts/development/implementation.md#efficient-algorithms

B bones and child edges drive graph indexing/walks with proportional temporary sets/maps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local bone/children index serves all root/parent/reachability checks.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller's collector owns faults; no FK pose, skeleton cache or native rig persists.
