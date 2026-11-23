# src/physics/trackPhysicalBalanceTargets.ts#trackPhysicalBalanceTargets

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Balance owns a coherent support posture independently of optional Cartesian endpoint actuators) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Balance owns a coherent support posture independently of optional Cartesian endpoint actuators) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over Object.entries(targets); filter over input.planted; filter over [...posture] .map((bone: strin), delegating to `Object.entries`, `Vector3.add`, `physicalRecoverySupportGoals`, `base.translation`, `base.rotation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.001, 0.15, 24, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 144 lines and 9 top-level statements that reuses `Object.entries`, `Vector3.add`, `physicalRecoverySupportGoals`, `base.translation`, `base.rotation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 10 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over Object.entries(targets); filter over input.planted; filter over [...posture] .map((bone: strin), performed once per call with 16 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 16 allocation sites become the returned value or die with the call, so nothing grows.
