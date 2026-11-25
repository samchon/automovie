# src/perform/HumanPerformancePlaceAction.ts#HumanPerformancePlaceAction

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `HumanPerformancePlace.place` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

An anchor is read from the placed actions, an open group's anchored part placed first on demand; an anchor not placed earlier is refused with the placed anchors as alternatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanPerformancePlace.place`: its reader of anchored actions, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPerformancePlace.place`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPerformancePlace.place` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `HumanPerformancePlace.place` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
