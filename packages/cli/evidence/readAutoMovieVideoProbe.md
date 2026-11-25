# src/readAutoMovieVideoProbe.ts#readAutoMovieVideoProbe

## @evidence contracts/development/common.md#meaningful-documentation

States what is read from where, the rate's fallback and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

FFmpeg prints `Duration: HH:MM:SS.ss` for every input and, for a video stream, `WxH` followed by `fps` and `tbr`, its frame and base rates; reading the log FFmpeg already writes needs no `ffprobe`, which `ffmpeg-static` does not ship.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per value.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing value throws instead of taking a default raster or rate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the log.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one log.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns four numbers.
