# src/physics/admitPhysicalTargets.ts#admitPhysicalTargets

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Admit every sampled ownership, effort and world pose before target fitting or native allocation) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Admit every sampled ownership, effort and world pose before target fitting or native allocation) directly over its typed inputs (`input`, `body`) as nested iteration of depth 3 (for-of over body.targets.entries(); some over Array.from(target.dynamicSegments); some over body.profile.segments), delegating to `Number.isFinite`, `Object.keys`, `Array.isArray`, `Array.from(target.dynamicSegments).some`, `Array.from`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (8 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 0.000001, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 139 lines and 2 top-level statements that reuses `Number.isFinite`, `Object.keys`, `Array.isArray`, `Array.from(target.dynamicSegments).some`, `Array.from` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`, `body`; the dominant cost is nested iteration of depth 3 (for-of over body.targets.entries(); some over Array.from(target.dynamicSegments); some over body.profile.segments), performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.
