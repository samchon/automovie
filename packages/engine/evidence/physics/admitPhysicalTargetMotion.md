# src/physics/admitPhysicalTargetMotion.ts#admitPhysicalTargetMotion

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (After raw poses/effort maps are admitted, validate their composed transforms, interval twists, COM transport and implicit motor damping before creating a native world) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (After raw poses/effort maps are admitted, validate their composed transforms, interval twists, COM transport and implicit motor damping before creating a native world) directly over its typed inputs (`input`, `body`) as nested iteration of depth 4 (some over input.bodies; for-of over body.targets.entries(); for-of over body.profile.segments), delegating to `samplePhysicalTarget`, `assertPhysicalFiniteMotion`, `physicalSupportPoint`, `Math.max`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 71 lines and 5 top-level statements that reuses `samplePhysicalTarget`, `assertPhysicalFiniteMotion`, `physicalSupportPoint`, `Math.max` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 8 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`, `body`; the dominant cost is nested iteration of depth 4 (some over input.bodies; for-of over body.targets.entries(); for-of over body.profile.segments), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
