# src/resolve/composeScene.ts#composeScene

## @evidence contracts/development/implementation.md#principled-implementation

Admit unique ids and existing parents, recursively resolve parent-first matrices with cycle detection and memoization, and multiply full matrices so nonuniform-scale shear survives composition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

An id index owns graph admission and one resolver closure owns rest/override local composition independent of input ordering.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing parents, duplicate ids and cycles throw; arbitrary deep acyclic graphs can still exceed recursion depth, and numerical transform validity remains caller admission.

## @evidence contracts/development/common.md#meaningful-documentation

Docs state parent-local transforms, override absence retaining rest pose, arbitrary node order and column-major full-matrix output.

## @evidence contracts/development/implementation.md#efficient-algorithms

N nodes require O(N) fixed-size matrix work and O(N) maps/results, with recursion stack O(H) for hierarchy depth H.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each node's completed world matrix is reused for all children within this call; changed graph/local overrides require a fresh composition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns returned matrices/map; admission indices and active-path set are released on return/failure, with no native scene graph or task retained.
