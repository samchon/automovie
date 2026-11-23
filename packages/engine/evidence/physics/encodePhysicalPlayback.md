# src/physics/encodePhysicalPlayback.ts#encodePhysicalPlayback

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Pack a complete cache once on a build machine; checkpoints remain with the producer) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Pack a complete cache once on a build machine; checkpoints remain with the producer) directly over its typed inputs (`cache`, `maximumBytes`) as nested iteration of depth 3 (flatMap over Object.entries( cache.frames[0]!.bod; map over Object.keys(bones); for-of over cache.frames), delegating to `Number.isSafeInteger`, `Object.entries( cache.frames[0]!.bodies, ).f`, `Object.entries`, `Object.keys(bones).map`, `Object.keys`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (5 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 8, 13, 32, 1095585841, 4, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One async operation of 84 lines and 18 top-level statements that reuses `Number.isSafeInteger`, `Object.entries( cache.frames[0]!.bodies, ).f`, `Object.entries`, `Object.keys(bones).map`, `Object.keys` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `cache`, `maximumBytes`; the dominant cost is nested iteration of depth 3 (flatMap over Object.entries( cache.frames[0]!.bod; map over Object.keys(bones); for-of over cache.frames), performed once per call with 12 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
