# src/geometry/construction/AutoMovieNativeCoordinate.ts#AutoMovieNativeCoordinate.locate

## @evidence contracts/development/common.md#meaningful-documentation

Documents the member contract in its own summary: Solve local x (component0) or z (component1) on a positive/negative other-coordinate half.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Solve local x (component0) or z (component1) on a positive/negative other-coordinate half) directly over its typed inputs (`inputs`, `component`, `half`, `target`) as 2 sequential passes (for loop bounded by iterations < 64; map over inputs.extents), delegating to `Number.isFinite`, `fail`, `AutoMovieLoftSectionNative.point`, `read`, `Math.min`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 64, 32, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 73 lines and 17 top-level statements that reuses `Number.isFinite`, `fail`, `AutoMovieLoftSectionNative.point`, `read`, `Math.min` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 64, 32 are not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `inputs`, `component`, `half`, `target`; the dominant cost is 2 sequential passes (for loop bounded by iterations < 64; map over inputs.extents), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
