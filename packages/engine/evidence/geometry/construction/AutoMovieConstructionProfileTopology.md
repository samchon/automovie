# src/geometry/construction/AutoMovieConstructionProfileTopology.ts#AutoMovieConstructionProfileTopology.admit

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Validate only the declared capability shape; actual source geometry remains authoritative.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Validate only the declared capability shape; actual source geometry remains authoritative) directly over its typed inputs (`definition`, `source`) as nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces), delegating to `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 11 lines and 1 top-level statements that reuses `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `definition`, `source`; the dominant cost is nested iteration of depth 2 (for-of over definition.loops; for-of over loop.pieces), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.

# src/geometry/construction/AutoMovieConstructionProfileTopology.ts#AutoMovieConstructionProfileTopology.period

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Normalize one complete original period without fitting or joining different functions.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Normalize one complete original period without fitting or joining different functions) directly over its typed inputs (`loop`, `piece`, `curve`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 3 lines and 1 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `loop`, `piece`, `curve`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
