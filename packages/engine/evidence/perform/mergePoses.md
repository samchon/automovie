# src/perform/mergePoses.ts#mergePoses

## @evidence contracts/development/implementation.md#principled-implementation

A bone-keyed insertion-ordered Map performs whole-joint replacement, preserving null axes on an overriding joint rather than merging individual controls.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This primitive owns last-wins union; weighted composition has a separate blendPoses owner and timeline assembly decides which one its semantics require.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ROM clamp or null-axis repair hides an authored override; callers must supply compatible validated poses.

## @evidence contracts/development/common.md#meaningful-documentation

Documents nonempty/same-skeleton premises, whole-joint precedence, stable order and borrowed nested ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

For J total joints and P poses, O(P+J) time and O(B) map/output storage for B distinct bones; every joint must participate in precedence.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrowed joint/root values are reused because union does not alter them; one Map entry per bone replaces earlier values without pose rebaking.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned pose/array, borrowed nested values remain input-owned, and the temporary map is released without retained tasks or handles.
