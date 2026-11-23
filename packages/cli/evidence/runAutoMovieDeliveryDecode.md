# src/runAutoMovieDeliveryDecode.ts#runAutoMovieDeliveryDecode

## @evidence contracts/development/common.md#meaningful-documentation

Names the same encoded artifact, commissioned clock, process, the optional loudness meter for the audio pass and per-stream output.

## @evidence contracts/development/implementation.md#principled-implementation

Executes the primary video plan before any audio decode, then independently measures the actually listed audio from the same file.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses the established process owner and delegates log and sample interpretation to the respective decoder owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves explicit missing and uncovered coverage states and cannot manufacture a pass after a process failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses one video pass and no audio process for a video-only source.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The primary video decode's input inventory addresses the audio pass, so no separate probe of the same file runs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each FFmpeg process is started, awaited and released by the process owner; the function keeps nothing after it returns.
