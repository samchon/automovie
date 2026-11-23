# src/audio/encodeAutoMovieWavPcm16.ts#encodeAutoMovieWavPcm16

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Encode two equally long normalized channels as a canonical 44-byte-header RIFF/WAVE file of 16-bit little-endian PCM stereo) and documents parameters `left`, `right`, `sampleRate`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Encode two equally long normalized channels as a canonical 44-byte-header RIFF/WAVE file of 16-bit little-endian PCM stereo) directly over its typed inputs (`left`, `right`, `sampleRate`) as nested iteration of depth 2 (for loop bounded by k < text.length; for loop bounded by k < left.length; for loop bounded by channel < 2), delegating to `Number.isSafeInteger`, `text.charCodeAt`, `tag`, `view.setUint32`, `view.setUint16`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 4294967295, 36, 4, 44, 8, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 41 lines and 19 top-level statements that reuses `Number.isSafeInteger`, `text.charCodeAt`, `tag`, `view.setUint32`, `view.setUint16` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `left`, `right`, `sampleRate`; the dominant cost is nested iteration of depth 2 (for loop bounded by k < text.length; for loop bounded by k < left.length; for loop bounded by channel < 2), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
