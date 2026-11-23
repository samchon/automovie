# src/internal/mesh-observations/signedArea.ts#signedArea

## @evidence contracts/development/implementation.md#principled-implementation

The shoelace sum on translated coordinates gives signed polygon area while reducing cancellation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Translation preserves area and keeps the input polygon untouched.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.

## @evidence contracts/development/common.md#meaningful-documentation

States the operation, physical interpretation and its documented degeneracy or ownership limits.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) arithmetic with constant auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each call depends directly on its arguments; no retained cache or effectful shared work exists.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a scalar accumulator and an input-origin reference live during the call.
