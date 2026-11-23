# src/createAutoMovieDeliveryAudioScan.ts#createAutoMovieDeliveryAudioScan

## @evidence contracts/development/common.md#meaningful-documentation

Gives the sample format, per-channel rule, presented range and exact interval boundary behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Counts one sample frame per complete group of channels and checks any silence duration against the rational threshold rounded upward to the next sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses one small carry buffer for split floats and a single open silence interval across chunks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nonfinite samples and partial floats or channel frames make evidence invalid, including in padding.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits each float once, retaining a single partial float and only threshold-qualifying intervals.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each decoded audio stream is scanned once by its own scanner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The scanner keeps a four-byte carry, its counters and the silent intervals that qualify, acquires no handle, and is released with the caller's reference.
