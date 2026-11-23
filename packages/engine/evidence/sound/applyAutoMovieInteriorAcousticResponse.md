# src/sound/applyAutoMovieInteriorAcousticResponse.ts#applyAutoMovieInteriorAcousticResponse

## @evidence contracts/development/implementation.md#principled-implementation

Outdoor copies input, partition response multiplies by admitted gain, and same-room adds at most 32 delayed taps at nearest-sample 20ms spacing (at least one sample), with 10^(-3t/T60) decay and a tail bounded by two seconds; this sparse tier is not a measured impulse-response reconstruction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One PCM owner consumes the closed room-path receipt without decoding adopted bytes or recomputing room geometry; unavailable outcomes throw before an output is published.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Finite input, channel shape and response quantities are admitted explicitly; Float32 accumulation can still overflow for sufficiently large finite input amplitudes, so input finiteness alone does not certify finite output.

## @evidence contracts/development/common.md#meaningful-documentation

States path-specific gain/tail policy, fresh output and refusal effects; source sample-rate provenance and geometric response derivation belong to the caller.

## @evidence contracts/development/implementation.md#efficient-algorithms

N interleaved samples and T<=32 taps cost O(N*T) same-room work with O(N+sampleRate*tail*channels) output storage; outdoor/partition paths scan/copy O(N).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each delayed tap gain/offset is computed once for its full sample traversal, and one supplied response serves the whole generation; no PCM or response cache persists between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the fresh PCM result, input is read without mutation, and local tap state retains no decoder, adopted bytes, process or audio device.
