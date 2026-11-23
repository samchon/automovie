# src/geometry/construction/AutoMovieConstructionProfile.ts#AutoMovieConstructionProfile

## @evidence contracts/development/common.md#meaningful-documentation

States metre-to-mm conversion, normalized piece coordinates, independent Point0, failure ownership and the limits of chart/section admission.

## @evidence contracts/development/design.md#principled-representation

The create operation prepares original curve owners and atlas readers under IAutoMoviePreparedConstructionProfile.IPrepared, preserving the declared physical and normalized clocks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This namespace owns runtime preparation; interface owns the prepared record shared with profile grids and body assembly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The public surface uses the canonical source and prepared contracts; it introduces neither a fitted substitute curve nor a duplicate runtime-owned type.

# src/geometry/construction/AutoMovieConstructionProfile.ts#AutoMovieConstructionProfile.create

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Prepare immutable original owners; malformed domains/references throw before publication.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Prepare immutable original owners; malformed domains/references throw before publication) directly over its typed inputs (`source`) as nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over definition.guides), delegating to `structuredClone`, `interval`, `fail`, `AutoMovieConstructionProfileTopology.admit`, `byLoop.has`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1000, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 264 lines and 17 top-level statements that reuses `structuredClone`, `interval`, `fail`, `AutoMovieConstructionProfileTopology.admit`, `byLoop.has` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 28 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `source`; the dominant cost is nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces; for-of over definition.guides), performed once per call with 19 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 19 allocation sites become the returned value or die with the call, so nothing grows.
