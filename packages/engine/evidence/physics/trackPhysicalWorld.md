# src/physics/trackPhysicalWorld.ts#trackPhysicalWorld

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Apply bounded PD forces and equal-opposite joint torques before the fixed step) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Apply bounded PD forces and equal-opposite joint torques before the fixed step) directly over its typed inputs (`world`, `input`, `bound`, `step`, `softened`, `diagnostics`, `recovery`, `contacts`, `seconds`) as nested iteration of depth 3 (for-of over input.bodies; for-of over body.profile.segments; for-of over bound.segments.get(body.id)!.values()), delegating to `samplePhysicalTrackingTarget`, `physicalTrackingWithdrawn`, `hasPhysicalHandoff`, `releasePhysicalTracking`, `samplePhysicalAuthoredTargets`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-7, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 423 lines and 3 top-level statements that reuses `samplePhysicalTrackingTarget`, `physicalTrackingWithdrawn`, `hasPhysicalHandoff`, `releasePhysicalTracking`, `samplePhysicalAuthoredTargets` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 33 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `world`, `input`, `bound`, `step`, `softened`, `diagnostics`, `recovery`, `contacts`, `seconds`; the dominant cost is nested iteration of depth 3 (for-of over input.bodies; for-of over body.profile.segments; for-of over bound.segments.get(body.id)!.values()), performed once per call with 36 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 36 allocation sites become the returned value or die with the call, so nothing grows.
