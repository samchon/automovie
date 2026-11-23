# src/physics/distributePhysicalSupportWrench.ts#distributePhysicalSupportWrench

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Allocate a requested floating-base wrench at actual floor points) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Allocate a requested floating-base wrench at actual floor points) directly over its typed inputs (`input`) as nested iteration of depth 3 (every over [ input.origin, input.force,; map over input.points; every over [value.x, value.y, value.z]), delegating to `Number.isFinite`, `Vector3.subtract`, `Math.max`, `levers.map`, `Vector3.length`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 1024, 3, 6, 0.000001, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 176 lines and 22 top-level statements that reuses `Number.isFinite`, `Vector3.subtract`, `Math.max`, `levers.map`, `Vector3.length` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (every over [ input.origin, input.force,; map over input.points; every over [value.x, value.y, value.z]), performed once per call with 39 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 39 allocation sites become the returned value or die with the call, so nothing grows.
