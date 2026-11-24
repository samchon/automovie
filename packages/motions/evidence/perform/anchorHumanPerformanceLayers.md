# src/perform/anchorHumanPerformanceLayers.ts#anchorHumanPerformanceLayers

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `HumanPerformanceState's constructor` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A layer whose two ends are film seconds or cue-track instants is timed before placement, so its instants are a cue track actions can sync to; a name already used by a layer or a cue track is refused rather than shadowed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanPerformanceState's constructor`: the anchored layers' early instants, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPerformanceState's constructor`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPerformanceState's constructor` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `HumanPerformanceState's constructor` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
