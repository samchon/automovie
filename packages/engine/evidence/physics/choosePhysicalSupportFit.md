# src/physics/choosePhysicalSupportFit.ts#choosePhysicalSupportFit

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Choose one bounded support fit among candidates fitted from different seeds) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Choose one bounded support fit among candidates fitted from different seeds) directly over its typed inputs (`input`) as nested iteration of depth 2 (map over input.candidates; reduce over input.joints; filter over scored), delegating to `Math.max`, `Object.values`, `angle`, `scored.filter`, `pool.reduce`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 35 lines and 5 top-level statements that reuses `Math.max`, `Object.values`, `angle`, `scored.filter`, `pool.reduce` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (map over input.candidates; reduce over input.joints; filter over scored), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
