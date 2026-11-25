# src/scene/inspection/readAutoMovieCollisionMesh.ts#readAutoMovieCollisionMesh

## @evidence contracts/development/common.md#meaningful-documentation

States the three admitted kinds and when each surface is posed.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the stock box proof, the skin owner's culling sphere and pose, and topology-derived closure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader per ordinary mesh kind, sharing the lazy surface owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Custom appearance, morphs, custom mesh classes and open surfaces certify nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per mesh until a candidate pair reads its surface.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The box proof and topology are cached per geometry version.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure borrows the mesh for the current observation.
