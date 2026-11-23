# src/physics/decodePhysicalPlayback.ts#decodePhysicalPlayback

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit one downloaded/archive byte sequence against the current authored input identity) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit one downloaded/archive byte sequence against the current authored input identity) directly over its typed inputs (`source`, `expectedIdentity`, `budget`) as nested iteration of depth 2 (every over [budget.maximumBytes, budget.maximumFram; some over digest; some over header.segments), delegating to `Number.isSafeInteger`, `view.getUint32`, `bytes.subarray`, `digest.some`, `JSON.parse`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (8 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 40, 1095585841, 4, 32, 8, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One async operation of 94 lines and 19 top-level statements that reuses `Number.isSafeInteger`, `view.getUint32`, `bytes.subarray`, `digest.some`, `JSON.parse` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 40, 1095585841, 4, 32, 8 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `source`, `expectedIdentity`, `budget`; the dominant cost is nested iteration of depth 2 (every over [budget.maximumBytes, budget.maximumFram; some over digest; some over header.segments), performed once per call with 17 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The body awaits asynchronous work; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
