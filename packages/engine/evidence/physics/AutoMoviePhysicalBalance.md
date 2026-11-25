# src/physics/AutoMoviePhysicalBalance.ts#AutoMoviePhysicalBalance.assess

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Order reachable recovery supports by travel distance, then declared footfall phase.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Order reachable recovery supports by travel distance, then declared footfall phase) directly over its typed inputs (`input`) as nested iteration of depth 2 (every over [ input.center.x, input.; flatMap over input.supports; for loop bounded by i < polygon.length) plus a sort, delegating to `Number.isFinite`, `Math.sqrt`, `convexHull2D`, `Math.max`, `Math.min`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 152 lines and 19 top-level statements that reuses `Number.isFinite`, `Math.sqrt`, `convexHull2D`, `Math.max`, `Math.min` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (every over [ input.center.x, input.; flatMap over input.supports; for loop bounded by i < polygon.length) plus a sort, performed once per call with 13 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 13 allocation sites become the returned value or die with the call, so nothing grows.
