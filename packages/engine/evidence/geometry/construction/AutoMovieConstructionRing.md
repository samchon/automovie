# src/geometry/construction/AutoMovieConstructionRing.ts#AutoMovieConstructionRing.create

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates host endpoint positions once and assigns their vertex indices to both charts, reversing the part's index correspondence when stations oppose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation owns shared vertex allocation and both neighbour/cycle records, so no post-tessellation welding stage is needed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the caller's face/station/count/sign data without distance matching or an independent endpoint-equality check; invalid inputs can throw after mutation, so realization owns the admitted context.

## @evidence contracts/development/common.md#meaningful-documentation

States mutation, prior endpoint agreement, winding/phase mapping and the mm/radian chart convention through IRing.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F mesh owners and C ring samples, owner lookup costs O(F), C surface jets supply positions and O(C) work builds cycles/adjacency arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both faces share exact vertex indices; the owner lookup reuses the existing unique-name surface owner in this admitted body.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body retains C vertices and two O(C) cycle/adjacency records, with a surface closure only if its owner is newly registered; the local order array has call lifetime.
