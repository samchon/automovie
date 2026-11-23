# src/physics/physicalJointInertia.ts#physicalJointInertia

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Project both bodies' world inverse inertia tensors onto each joint axis, giving relative-rotation inertia) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Project both bodies' world inverse inertia tensors onto each joint axis, giving relative-rotation inertia) directly over its typed inputs (`frame`, `child`, `parent`) as nested iteration of depth 2 (map over [ { x: 1, y: 0, z: 0 }, { x: 0, ; for-of over parent ? [child, parent] : [child]; for-of over (["x", "y", "z"] as const).entries()), delegating to `Quaternion.rotateVector`, `body.inverseInertia`, `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 36 lines and 6 top-level statements that reuses `Quaternion.rotateVector`, `body.inverseInertia`, `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `frame`, `child`, `parent`; the dominant cost is nested iteration of depth 2 (map over [ { x: 1, y: 0, z: 0 }, { x: 0, ; for-of over parent ? [child, parent] : [child]; for-of over (["x", "y", "z"] as const).entries()), performed once per call with 11 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 11 allocation sites become the returned value or die with the call, so nothing grows.
