# src/geometry/construction/AutoMovieNativeCoordinate.ts#AutoMovieNativeCoordinate

## @evidence contracts/development/common.md#meaningful-documentation

Coordinates/targets use kernel mm, returned phase uses original radians, half refers to the other coordinate's sign, and endpoint Point0 does not imply a regular inverse derivative.

## @evidence contracts/development/design.md#principled-representation

Represents Locate an original native coordinate on one declared monotone half profile: companion namespace of 2 members (`IResult`, `locate`); units and frames named in its text: radians, local. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieNativeCoordinate` in packages/engine/src/geometry/construction/AutoMovieNativeCoordinate.ts; its surface is the 2 members listed and the text shows 8 other files naming it, mostly packages/human (6), packages/engine (1), test (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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
