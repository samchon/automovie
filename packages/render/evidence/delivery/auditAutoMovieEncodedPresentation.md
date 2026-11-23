# src/delivery/auditAutoMovieEncodedPresentation.ts#auditAutoMovieEncodedPresentation

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Check an encoded delivery's probe against its commissioned profile: exactly one H.264 video stream of the raster and integer frame rate and one AAC audio stream of the sample rate and channel count, each starting at zero and presenting exactly the commissioned whole seconds in its own rational time base, so AAC end padding never passes for film duration) and documents parameters `probe`, `expected` as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Check an encoded delivery's probe against its commissioned profile: exactly one H.264 video stream of the raster and integer frame rate and one AAC audio stream of the sample rate and channel count, each starting at zero and presenting exactly the commissioned whole seconds in its own rational time base, so AAC end padding never passes for film duration) directly over its typed inputs (`probe`, `expected`) as 4 sequential passes (map over streams; find over records; find over records), delegating to `Number.isSafeInteger`, `Array.isArray`, `streams.map`, `records.find`, `String`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 48000, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 57 lines and 8 top-level statements that reuses `Number.isSafeInteger`, `Array.isArray`, `streams.map`, `records.find`, `String` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 2 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `probe`, `expected`; the dominant cost is 4 sequential passes (map over streams; find over records; find over records), performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
