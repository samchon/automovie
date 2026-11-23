# src/scene/inspection/observeAutoMovieSceneCollision.ts#observeAutoMovieSceneCollision

## @evidence contracts/development/common.md#meaningful-documentation

Explains how layer clocks, placed shapes, groups, witnesses, scoped allowances and each check's coverage determine world-space evidence.

## @evidence contracts/development/implementation.md#principled-implementation

Native contact decides exact shapes; drawn-surface witnesses decide envelopes; a complete witness search proves clearance; joint labels scope named windows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collection, the Engine layer search, witness search and interval checks are separate modules called in order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No resampling or grouping by nesting. Clearance needs a complete search, and a scoped window relaxes only its joints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Surfaces are posed only for candidate pairs; comparison, vertex, triangle and interval work each has its own limit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Solids and posed surfaces are memoized for the frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows the placed scene for the call; only plain diagnostic values escape.
