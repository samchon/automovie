# src/runAutoMovieDeliverySourceAudioDecode.ts#runAutoMovieDeliverySourceAudioDecode

## @evidence contracts/development/common.md#meaningful-documentation

Names the encoder's audio filters reproduced and the evidence returned.

## @evidence contracts/development/implementation.md#principled-implementation

Applies the encoder's rate, layout, `apad` and cut as `atrim` before `ashowinfo`, then the same frame log and PCM scan as the delivered audio.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one argument vector and hands it to the shared decode.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A duration that is not a positive safe sample count, or a failed decode, returns uncovered with its reason.

## @evidence contracts/development/implementation.md#efficient-algorithms

Streams PCM once without materializing the soundtrack.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the delivered audio's process consumer, frame log and silence scan instead of a second implementation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains at most one MiB of pending PCM before the format is known, and the process owner settles the child.
