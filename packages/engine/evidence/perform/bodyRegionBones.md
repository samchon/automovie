# src/perform/bodyRegionBones.ts#bodyRegionBones

## @evidence contracts/development/implementation.md#principled-implementation

The three lists enumerate the declared humanoid union without overlap, so compiler masking gives each narrow region disjoint bone ownership.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One partition owner supplies region masks and avoids duplicate per-verb bone lists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The partition is the actual humanoid contract, not an inferred rig-specific subset; non-humanoid content must use the declared mapping rather than a fixture exception.

## @evidence contracts/development/common.md#meaningful-documentation

Documents face's expression-only meaning, full-body union and readonly borrowed partition ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Narrow regions return fixed arrays in constant work; fullBody copies the fixed B-bone union in O(B) time and storage, and face returns a fresh empty array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Module partition arrays are reused by narrow-region callers; fullBody's mutable underlying array is not globally shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed module arrays persist for module lifetime; callers must honor readonly access, while fresh union/empty arrays belong to the call with no resource handles.
