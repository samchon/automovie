# src/delivery/planAutoMovieVideoEncoding.ts#planAutoMovieVideoEncoding

## @evidence contracts/development/common.md#meaningful-documentation

States the frame count rule and its bound, the raster rule and why, every argument added to `ffmpegArgs` and the soundtrack's treatment, and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

A whole frame count admits the exact schedule `frameTimes` draws; mapping streams explicitly and cutting at `-t` makes the clock, not the shorter input, decide the output's length, and `apad` pads a soundtrack shorter than the picture. Setting the movie and video track timescales to the exact rate's numerator makes each frame last the denominator in ticks, so the track and edit durations equal the media duration in one clock and the movie clock never rounds a runtime that is not a whole number of milliseconds (FFmpeg's default movie timescale is 1000).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit, take the rate from the shared `autoMovieVideoFrameRate`, then one argument vector around the shared `ffmpegArgs`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No duration is rounded into acceptance and no raster is resized.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolves one bounded frame rate by continued fractions and allocates no frame schedule.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure plan of one request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a count and strings and keeps nothing.
