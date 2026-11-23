# src/animals/EquineBlend.ts#EquineBlend

## @evidence contracts/development/common.md#meaningful-documentation

States the blend, the floor support and its use.

## @evidence contracts/development/implementation.md#principled-implementation

Per-frame slerp and lerp in world space, read back into the second placement, then one lift by the lowest part's floor depth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Blend, lift, repose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lift only ever raises the body; nothing is clamped part by part.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P + A).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the fall and the foaling recumbency.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh model.
