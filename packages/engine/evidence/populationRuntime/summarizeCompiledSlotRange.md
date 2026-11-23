# src/populationRuntime/summarizeCompiledSlotRange.ts#summarizeCompiledSlotRange

## @evidence contracts/development/implementation.md#principled-implementation

Fold ascending positions into axis extrema and the historical incremental mean through createCompiledSlotSummary; order is preserved because compiled digest identity depends on binary64 operation order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The range owner supplies slot addresses while the shared accumulator owns summary arithmetic, preventing drift between range and combined chunk/global folds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No slot or content id changes arithmetic; empty ranges retain infinite bounds and zero centroid and therefore are outside admitted positive population summaries.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify exact placement-point bounds, incremental centroid, ascending traversal and package-private sharing; geometry expansion remains separate.

## @evidence contracts/development/implementation.md#efficient-algorithms

N positions take O(N) callback work plus constant arithmetic per point and O(1) auxiliary fold storage; callback placement cost must be included by its owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both range and combined summaries share the accumulator implementation; each call recomputes from its ordered current points rather than caching mutable placements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the summary vectors transfer to the caller; no point history, callback reference, task or resource survives completion or failure.
