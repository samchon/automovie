# src/createAutoMovieDeliveryAudioLog.ts#createAutoMovieDeliveryAudioLog

## @evidence contracts/development/common.md#meaningful-documentation

Describes audio frame-log coverage, reconciliation with PCM and the container end, and carries the scan's loudness measurement onto the decoded stream.

## @evidence contracts/development/implementation.md#principled-implementation

FFmpeg's audio input filter uses one tick per sample frame. Checks that logged frame indices, format and PTS stay continuous and that observed sample bytes cover the same count. Trims only what the container's own presentation excludes from the final codec frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads only ashowinfo rows and retains the first format, the last frame size and the last timing boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Marks unsupported evidence, byte count mismatches and differing container and decoder clocks uncovered instead of inferring sample counts. Never trims to the commissioned length.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains constant timing state, with one visit per logged audio frame.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each decode log is read by its own accumulator once; no other reader needs its partial state.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The accumulator keeps only its constant timing state for the one decode it reads and acquires no handle, so it is released with the caller's reference.
