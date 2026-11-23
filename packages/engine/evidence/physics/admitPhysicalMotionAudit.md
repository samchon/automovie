# src/physics/admitPhysicalMotionAudit.ts#admitPhysicalMotionAudit

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Invalid promises cannot produce a successful finite-sample audit by making comparisons false) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Invalid promises cannot produce a successful finite-sample audit by making comparisons false) directly over its typed inputs (`input`) as nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over input.bodies; every over [body.jointTolerance, body.floorToleranc), delegating to `Number.isFinite`, `Number.isSafeInteger`, `Math.ceil`, `Array.isArray`, `ids.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (9 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 124 lines and 5 top-level statements that reuses `Number.isFinite`, `Number.isSafeInteger`, `Math.ceil`, `Array.isArray`, `ids.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (every over [value.x, value.y, value.z]; for-of over input.bodies; every over [body.jointTolerance, body.floorToleranc), performed once per call with 21 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 21 allocation sites become the returned value or die with the call, so nothing grows.
