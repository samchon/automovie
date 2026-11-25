# src/perform/HumanPerformancePlaceCue.ts#HumanPerformancePlaceCue

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes from what `HumanPerformancePlace.place` hands it and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A cue track is read by name from the performance's cues; an unknown name is refused with the tracks the performance has.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility of `HumanPerformancePlace.place`: its reader of cue tracks, apart from its other parts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moved unchanged from `HumanPerformancePlace.place`; no value, tolerance, fallback or search is added.

## @evidence contracts/development/implementation.md#efficient-algorithms

Called where `HumanPerformancePlace.place` computed it before; its cost is the moved code's.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the values `HumanPerformancePlace.place` already holds instead of computing them again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only what its result holds, for as long as the caller holds it.
