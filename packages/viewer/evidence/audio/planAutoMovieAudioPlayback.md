# src/audio/planAutoMovieAudioPlayback.ts#planAutoMovieAudioPlayback

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Which cues sound when playback starts at a film instant and runs at a transport rate, and how each is started: a cue already sounding starts at once part-way into its excerpt, a later cue after its film delay divided by the transport rate, and an ended cue not at all) and documents parameters `cues`, `seconds`, `rate`, `lengths`, the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Which cues sound when playback starts at a film instant and runs at a transport rate, and how each is started: a cue already sounding starts at once part-way into its excerpt, a later cue after its film delay divided by the transport rate, and an ended cue not at all) directly over its typed inputs (`cues`, `seconds`, `rate`, `lengths`) as a single pass (for-of over cues), delegating to `Number.isFinite`, `Math.max`, `starts.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 25 lines and 4 top-level statements that reuses `Number.isFinite`, `Math.max`, `starts.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `cues`, `seconds`, `rate`, `lengths`; the dominant cost is a single pass (for-of over cues), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
