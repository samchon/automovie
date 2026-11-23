# src/physics/planPhysicalSupportTargets.ts#planPhysicalSupportTargets

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Feed a changed support placement back to bounded joint goals) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Feed a changed support placement back to bounded joint goals) directly over its typed inputs (`input`) as 2 sequential passes (map over Object.entries(input.targets); for-of over input.pattern.limbs), delegating to `physicalSupportRootDrop`, `Object.fromEntries`, `Object.entries(input.targets).map`, `Object.entries`, `solvePhysicalChainTarget`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 32 lines and 5 top-level statements that reuses `physicalSupportRootDrop`, `Object.fromEntries`, `Object.entries(input.targets).map`, `Object.entries`, `solvePhysicalChainTarget` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (map over Object.entries(input.targets); for-of over input.pattern.limbs), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
