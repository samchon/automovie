# src/physics/fitPhysicalWholeBodyTarget.ts#fitPhysicalWholeBodyTarget

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Fit a whole articulated body to one endpoint goal while a support segment stays held, turning only about its contact) and documents the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Fit a whole articulated body to one endpoint goal while a support segment stays held, turning only about its contact) directly over its typed inputs (`input`) as nested iteration of depth 2 (some over input.profile.segments; map over rerooted.joints .filter( (; filter over rerooted.joints), delegating to `along`, `rerootPhysicalProfile`, `Quaternion.rotateVector`, `Quaternion.inverse`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 3, 4, 5, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 119 lines and 14 top-level statements that reuses `along`, `rerootPhysicalProfile`, `Quaternion.rotateVector`, `Quaternion.inverse`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (some over input.profile.segments; map over rerooted.joints .filter( (; filter over rerooted.joints), performed once per call with 30 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 30 allocation sites become the returned value or die with the call, so nothing grows.
