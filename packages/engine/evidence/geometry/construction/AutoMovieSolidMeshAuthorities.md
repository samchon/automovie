# src/geometry/construction/AutoMovieSolidMeshAuthorities.ts#AutoMovieSolidMeshAuthorities.consumedByCell

## @evidence contracts/development/implementation.md#principled-implementation

Distinguishes an identical grid side or an isolated shared grid corner from every partial, longer or nonaligned authority segment. The caller still resolves the original IDs at those exact corners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exact chart predicate lets Grid retain its cells beside aligned original domain authorities; actual cutting loops never use this exception.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses no tolerance, new vertex, weld or segment subdivision. An authority knot inside a cell side and a coarse authority spanning several cells remain residual constraints.

## @evidence contracts/development/common.md#meaningful-documentation

A true result describes consumption in this finite grid cell, not a source membership, surface chord certificate or arbitrary trim exemption. Inputs are the admitted face's finite lifted chart values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant exact endpoint and interval comparisons per already-overlapping authority occurrence.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The pure predicate coordinates no requests or preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no arrays, mesh or source; the caller owns the supplied endpoint values.

# src/geometry/construction/AutoMovieSolidMeshAuthorities.ts#AutoMovieSolidMeshAuthorities.domainSegments

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Seed actual rectangular domain points; return a named premise before any source or mesh write.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Seed actual rectangular domain points; return a named premise before any source or mesh write) directly over its typed inputs (`mesh`, `input`, `chart`, `period`) as nested iteration of depth 2 (for-of over loops; for-of over loop.chart; for-of over segments), delegating to `Array.isArray`, `collect`, `chart.get`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 52 lines and 14 top-level statements that reuses `Array.isArray`, `collect`, `chart.get` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 6 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `mesh`, `input`, `chart`, `period`; the dominant cost is nested iteration of depth 2 (for-of over loops; for-of over loop.chart; for-of over segments), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.

# src/geometry/construction/AutoMovieSolidMeshAuthorities.ts#AutoMovieSolidMeshAuthorities.collect

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Preserve original IDs; every repeated phase must equal the first authority plus its explicit integer period in binary64.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Preserve original IDs; every repeated phase must equal the first authority plus its explicit integer period in binary64) directly over its typed inputs (`mesh`, `loops`, `chart`, `period`) as nested iteration of depth 3 (for-of over loops; for loop bounded by k < loop.vertices.length; every over point), delegating to `Number.isSafeInteger`, `point.every`, `chart.get`, `chart.set`, `Math.round`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 79 lines and 3 top-level statements that reuses `Number.isSafeInteger`, `point.every`, `chart.get`, `chart.set`, `Math.round` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 12 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `mesh`, `loops`, `chart`, `period`; the dominant cost is nested iteration of depth 3 (for-of over loops; for loop bounded by k < loop.vertices.length; every over point), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
