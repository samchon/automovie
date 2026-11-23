# src/physics/trackPhysicalRoot.ts#trackPhysicalRoot

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Realize one bounded root demand through an external wrench, or under internal actuation as the root task of the motors' whole-body solve) directly over its typed inputs (`input`) as nested iteration of depth 3 (map over (["x", "y", "z"] as const); filter over ( body.supportTracking?.pattern ??; flatMap over supports .filter((support: (type), delegating to `Vector3.add`, `Tracking.force`, `Vector3.subtract`, `base.translation`, `base.velocityAtPoint`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 165 lines and 8 top-level statements that reuses `Vector3.add`, `Tracking.force`, `Vector3.subtract`, `base.translation`, `base.velocityAtPoint` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (map over (["x", "y", "z"] as const); filter over ( body.supportTracking?.pattern ??; flatMap over supports .filter((support: (type), performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Realize one bounded root demand through an external wrench, or under internal actuation as the root task of the motors' whole-body solve) as stated in this comment.
