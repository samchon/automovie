# src/geometry/construction/AutoMovieConstructionProfilePhase.ts#AutoMovieConstructionProfilePhase.create

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Borrow already admitted immutable originals; explicit null never falls back to total2.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Borrow already admitted immutable originals; explicit null never falls back to total2) directly over its typed inputs (`source`, `definition`) as nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over [frame.origin, frame.u, frame.v]), delegating to `charts.set`, `charts.get`, `Number.isFinite`, `fail`, `pair`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 1000, 3, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 30 lines and 3 top-level statements that reuses `charts.set`, `charts.get`, `Number.isFinite`, `fail`, `pair` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 1 type assertion(s), 17 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `source`, `definition`; the dominant cost is nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over [frame.origin, frame.u, frame.v]), performed once per call with 9 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 9 allocation sites become the returned value or die with the call, so nothing grows.
