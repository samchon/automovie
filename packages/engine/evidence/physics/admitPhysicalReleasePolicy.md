# src/physics/admitPhysicalReleasePolicy.ts#admitPhysicalReleasePolicy

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Contact withdrawal names actual other-body geometry and a finite local-time window) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Contact withdrawal names actual other-body geometry and a finite local-time window) directly over its typed inputs (`input`, `body`) as nested iteration of depth 3 (find over input.bodies; every over Array.from(selected); some over profile.segments), delegating to `Array.isArray`, `Array.from(selected).every`, `Array.from`, `Number.isFinite`, `validShapes`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 37 lines and 6 top-level statements that reuses `Array.isArray`, `Array.from(selected).every`, `Array.from`, `Number.isFinite`, `validShapes` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`, `body`; the dominant cost is nested iteration of depth 3 (find over input.bodies; every over Array.from(selected); some over profile.segments), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
