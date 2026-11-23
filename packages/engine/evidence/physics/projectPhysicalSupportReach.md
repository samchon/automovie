# src/physics/projectPhysicalSupportReach.ts#projectPhysicalSupportReach

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Bounded cyclic projection of a common root translation onto support-reach balls) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Bounded cyclic projection of a common root translation onto support-reach balls) directly over its typed inputs (`input`) as nested iteration of depth 2 (every over [value.x, value.y, value.z]; some over Array.from(input.supports); for loop bounded by iteration < input.iterations), delegating to `Array.isArray`, `Number.isFinite`, `Number.isSafeInteger`, `Array.from(input.supports).some`, `Array.from`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 67 lines and 7 top-level statements that reuses `Array.isArray`, `Number.isFinite`, `Number.isSafeInteger`, `Array.from(input.supports).some`, `Array.from` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 64 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (every over [value.x, value.y, value.z]; some over Array.from(input.supports); for loop bounded by iteration < input.iterations), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
