# src/scene/inspection/isAutoMovieFiniteVector.ts#isAutoMovieFiniteVector

## @evidence contracts/development/common.md#meaningful-documentation

States the condition.

## @evidence contracts/development/implementation.md#principled-implementation

Uses Number.isFinite, which refuses NaN and both infinities.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No component is coerced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by native placement and witness points.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and keeps nothing.
