# src/audio/playAutoMovieAudioCues.ts#playAutoMovieAudioCues

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Play a cue list through Web Audio from a film instant at a transport rate, as plans it: one buffer source per sounding cue, through a gain and an equal-power stereo panner, started at the context's current time plus its delay) and documents parameters `context`, `decoded`, `cues`, `seconds`, `rate`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Play a cue list through Web Audio from a film instant at a transport rate, as plans it: one buffer source per sounding cue, through a gain and an equal-power stereo panner, started at the context's current time plus its delay) directly over its typed inputs (`context`, `decoded`, `cues`, `seconds`, `rate`) as 3 sequential passes (map over Object.entries(decoded); for-of over planAutoMovieAudioPlayback( cues, ; for-of over sources), delegating to `Object.fromEntries`, `Object.entries(decoded).map`, `Object.entries`, `planAutoMovieAudioPlayback`, `context.createBufferSource`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 46 lines and 6 top-level statements that reuses `Object.fromEntries`, `Object.entries(decoded).map`, `Object.entries`, `planAutoMovieAudioPlayback`, `context.createBufferSource` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `context`, `decoded`, `cues`, `seconds`, `rate`; the dominant cost is 3 sequential passes (map over Object.entries(decoded); for-of over planAutoMovieAudioPlayback( cues, ; for-of over sources), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
