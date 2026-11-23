# src/physics/validatePhysicalProfile.ts#validatePhysicalProfile

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Collect every numeric, reference, mass and tree defect before simulation) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Collect every numeric, reference, mass and tree defect before simulation) directly over its typed inputs (`profile`) as nested iteration of depth 3 (every over [v.x, v.y, v.z]; every over [q.x, q.y, q.z, q.w]; for-of over profile.materials.entries()) plus a sort, delegating to `errors.push`, `Number.isFinite`, `Math.abs`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.000001, 1e-8, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 379 lines and 32 top-level statements that reuses `errors.push`, `Number.isFinite`, `Math.abs`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `profile`; the dominant cost is nested iteration of depth 3 (every over [v.x, v.y, v.z]; every over [q.x, q.y, q.z, q.w]; for-of over profile.materials.entries()) plus a sort, performed once per call with 23 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 23 allocation sites become the returned value or die with the call, so nothing grows.
