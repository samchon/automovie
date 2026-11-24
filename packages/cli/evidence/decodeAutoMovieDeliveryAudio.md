# src/decodeAutoMovieDeliveryAudio.ts#decodeAutoMovieDeliveryAudio

## @evidence contracts/development/common.md#meaningful-documentation

Names both output channels, the presented span, the optional loudness meter and the evidence returned.

## @evidence contracts/development/implementation.md#principled-implementation

Starts the scan only once the log establishes the decoded format, then requires the log and the PCM to cover the same frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One process, a line splitter for the log and a byte consumer for the PCM.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A process failure, an unknown format or a format that arrives after too much PCM returns uncovered with its reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans PCM incrementally without materializing the decoded audio.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the delivered and source audio decodes so both measure with the same consumers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains at most one MiB of pending PCM while waiting for the first frame log, then releases the queued chunks. The process owner settles the child before completion.
