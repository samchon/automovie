# src/film/playbackFrameSamples.ts#playbackFrameSamples

## @evidence contracts/development/implementation.md#principled-implementation

Computes each instant independently by binary64 division i/fps, avoiding cumulative addition drift without promising exact rationals or cross-host rendered bytes. A forward cursor reads this nondecreasing schedule; in exact arithmetic a nonempty rounded frame population ends before runtime, while numerical rounding and feasible array size remain limits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Layout is `sequenceTimeline`'s and sampling is `playbackCursor`'s; this function owns only the frame schedule, which it states the same way as the render plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every frame is resolved by the same cursor with no special first or last frame; an invalid frame rate is refused rather than defaulted.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame count and instants and their match with `frameTimes`, how a host uses the list, both thrown conditions, and the order of the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in frames plus entries: the timeline is built once and the cursor sweeps it forward once, instead of scanning every entry per frame.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One timeline is built and shared by every frame's query through one cursor, so the layout is computed once per call rather than once per frame.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The timeline and cursor are dropped on return; the caller owns the returned array, one sample per frame, bounded by `round(runtime × fps)`.
