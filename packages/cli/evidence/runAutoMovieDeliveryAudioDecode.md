# src/runAutoMovieDeliveryAudioDecode.ts#runAutoMovieDeliveryAudioDecode

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the selected artifact, stream, the optional loudness meter it passes on and evidence returned.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the presented duration from the same file before decoding, then feeds an independent frame log and PCM scan from one successful process. Requires both to cover the same number of frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the container, then delegates the process and its consumers to the shared decode.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unknown container timing, a failed or an unsupported decode returns uncovered with its reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads only the movie header and scans PCM incrementally without materializing a copy of the soundtrack.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the decode process and consumers with the source soundtrack decode.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains at most one MiB of pending PCM while waiting for the first frame log, then releases the queued chunks. The process owner settles the child before completion.
