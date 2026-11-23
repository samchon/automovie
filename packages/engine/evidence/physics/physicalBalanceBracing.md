# src/physics/physicalBalanceBracing.ts#physicalBalanceBracing

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Capture-point feedback toward the actual support hull under an explicit root-target travel bound) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Capture-point feedback toward the actual support hull under an explicit root-target travel bound) directly over its typed inputs (`input`) as 2 sequential passes (every over [ input.minimumCenterHeight, ; for loop bounded by index < input.assessment.polygon.length), delegating to `Math.max`, `Math.min`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 63 lines and 4 top-level statements that reuses `Math.max`, `Math.min`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (every over [ input.minimumCenterHeight, ; for loop bounded by index < input.assessment.polygon.length), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
