# src/architecture/designFrameScale.ts#designFrameScale

## @evidence contracts/development/implementation.md#principled-implementation

A first-match lookup of the selected candidate id among the frame's own candidates, returning its stated factor unchanged; an unresolved selection answers null so no caller can place a point on an unsettled scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup shared by world-point mapping and observation promotion, so "the frame's scale" is read the same way everywhere.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no frame or candidate and substitutes no default factor for an unknown scale.

## @evidence contracts/development/common.md#meaningful-documentation

States the return unit, both null cases and which validator refuses the dangling one, and the first-match rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(C) time and O(1) space for C candidates, stopping at the first match; no candidate-count cap is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure lookup on one frame value that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number already stored on the frame and keeps no reference to the frame or its candidates.
