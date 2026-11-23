# src/delivery/planAutoMovieVideoEncoding.ts#planAutoMovieVideoEncoding

## @evidence contracts/development/common.md#meaningful-documentation

States the frame count rule and its bound, the raster rule and why, every argument added to `ffmpegArgs` and the soundtrack's treatment, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A whole frame count admits the exact schedule `frameTimes` draws; mapping streams explicitly and cutting at `-t` makes the clock, not the shorter input, decide the output's length, and `apad` pads a soundtrack shorter than the picture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, then one argument vector around the shared `ffmpegArgs`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No duration is rounded into acceptance and no raster is resized.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolves one bounded frame rate by continued fractions and allocates no frame schedule.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure plan of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a count and strings and keeps nothing.
