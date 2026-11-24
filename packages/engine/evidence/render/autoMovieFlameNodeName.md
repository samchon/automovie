# src/render/autoMovieFlameNodeName.ts#autoMovieFlameNodeName

## @evidence contracts/development/implementation.md#principled-implementation

Join the node and cue ids under the flame: prefix, so the render mesh and its mask claim share one name, which is also the claim id.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The engine owns the convention without importing the render preparer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The name follows from the cue identity alone.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact name, its double use as the mask id and the boundary it bridges.

## @evidence contracts/development/implementation.md#efficient-algorithms

One concatenation, linear in the id lengths.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Mask derivation and the render preparer reuse it; nothing is cached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the string escapes.
