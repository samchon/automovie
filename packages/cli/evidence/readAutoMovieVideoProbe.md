# src/readAutoMovieVideoProbe.ts#readAutoMovieVideoProbe

## @evidence contracts/development/common.md#meaningful-documentation

States what is read from where, the rate's fallback and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The input log supplies duration and raster. The first video filter supplies the exact nominal frame-rate ratio through `showinfo`. Input-only logs and unavailable ratios fall back to the printed `fps` or `tbr`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the input metadata and choose the nominal rate from the filter or the input stream.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing value throws instead of taking a default raster or rate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the log.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of one log.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns four numbers.
