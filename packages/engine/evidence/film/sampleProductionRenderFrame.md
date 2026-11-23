# src/film/sampleProductionRenderFrame.ts#sampleProductionRenderFrame

## @evidence contracts/development/implementation.md#principled-implementation

Integer frame offsets address the outgoing tail and define linear ramps whose divisions use binary64 arithmetic. Time is independently frame·denominator/numerator at the reduced rational rate, avoiding accumulated decimal-fps drift; multiplication and division can round, including products beyond safe-integer precision.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A pure function of the timeline and one frame, the seam the render planner calls per output frame, with the time stamp in one private step; dissolve and fade stay together because both are read from the same segment offsets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No shot or segment is special-cased; a missing segment or a dissolve without an outgoing segment throws instead of drawing black or a single layer.

## @evidence contracts/development/common.md#meaningful-documentation

States the active-segment rule, both weight formulas and what `remaining` counts, the time stamp, the determinism guarantee, and every throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Binary search selects the last segment start at or before the frame in O(log N) time for N canonically ordered segments, then the exclusive end check and at most two layer calculations take constant work; F independently sampled frames cost O(F log N) without retaining a cursor.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Resolves one frame per call and keeps no cursor, so any frame can be sampled in any order; the frame rate is re-reduced per call because it is constant work on two integers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the returned frame with at most two layers, owned by the caller, and retains nothing.
