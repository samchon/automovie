# src/physics/assertPhysicalFiniteMotion.ts#assertPhysicalFiniteMotion

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Refuse composed poses, bounds and origin/COM twists that are not finite although their inputs are) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Refuse composed poses, bounds and origin/COM twists that are not finite although their inputs are) directly over its typed inputs (`segment`, `pose`, `velocity`, `angularVelocity`) as nested iteration of depth 2 (for-of over segment.shapes; every over values; every over [value.x, value.y, value.z]), delegating to `Quaternion.rotateVector`, `Vector3.add`, `values.push`, `Vector3.cross`, `physicalShapeBounds`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 35 lines and 6 top-level statements that reuses `Quaternion.rotateVector`, `Vector3.add`, `values.push`, `Vector3.cross`, `physicalShapeBounds` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `segment`, `pose`, `velocity`, `angularVelocity`; the dominant cost is nested iteration of depth 2 (for-of over segment.shapes; every over values; every over [value.x, value.y, value.z]), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
