# src/geometry/construction/AutoMovieConstructionProfileBody.ts#AutoMovieConstructionProfileBody

## @evidence contracts/development/common.md#meaningful-documentation

States original versus retained domains, mm grids, shared ownership, complete physical2 requirements and the caller's append-only transaction responsibility.

## @evidence contracts/development/design.md#principled-representation

The append operation publishes source charts and shared mesh boundaries, returning canonical IAutoMovieConstructionProfileBody.IEnd records for actual collapsed ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime body assembly stays here; interface owns the end records consumed by profile skin closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Canonical prepared-profile, body and end contracts preserve analytic source ownership separately from finite tessellation; ordinary open ends are not reclassified as collapsed tips.

# src/geometry/construction/AutoMovieConstructionProfileBody.ts#AutoMovieConstructionProfileBody.append

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Append prepared original faces; the realizing leaf owns rollback on any failure.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Append prepared original faces; the realizing leaf owns rollback on any failure) directly over its typed inputs (`body`, `prepared`, `tolerance`) as nested iteration of depth 4 (for-of over grids; map over pieces; map over pieces), delegating to `AutoMovieConstructionProfileGrid.create`, `pieces.map`, `AutoMovieSolidMesh.owner`, `vertex`, `known.get`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1000, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 141 lines and 5 top-level statements that reuses `AutoMovieConstructionProfileGrid.create`, `pieces.map`, `AutoMovieSolidMesh.owner`, `vertex`, `known.get` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 26 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `body`, `prepared`, `tolerance`; the dominant cost is nested iteration of depth 4 (for-of over grids; map over pieces; map over pieces), performed once per call with 21 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 21 allocation sites become the returned value or die with the call, so nothing grows.
