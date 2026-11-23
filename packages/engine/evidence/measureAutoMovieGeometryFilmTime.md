# src/measureAutoMovieGeometryFilmTime.ts#measureAutoMovieGeometryFilmTime

## @evidence contracts/development/implementation.md#principled-implementation

Rounds seconds times FPS only within 64 machine epsilons scaled to frame magnitude, requires a safe integer in [0,totalFrames), then scans backwards so overlap ownership matches the latest canonical segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single adapter owns exact-grid admission, segment ownership and source-in offset arithmetic without rebuilding the canonical timeline.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No nearest-frame approximation is accepted beyond roundoff tolerance and no segment is invented for a timeline gap.

## @evidence contracts/development/common.md#meaningful-documentation

States exact frame-grid interpretation, latest overlap owner, source-shot clock and failure effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

Backwards segment search is O(segment count) worst case with constant auxiliary space; it avoids copying and reversing the timeline to find the last owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Frame arithmetic and the selected segment are shared across all result fields; no cached ownership assumes timeline edits preserve boundaries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The borrowed timeline is not mutated or retained; only ids, numbers and transition-kind strings escape.
