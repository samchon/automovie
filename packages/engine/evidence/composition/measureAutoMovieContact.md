# src/composition/measureAutoMovieContact.ts#measureAutoMovieContact

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Measure whether two displayed bodies meet: the least signed separation, in metres, between every declared collider of one body's named segments (an effector, such as a striking surface) and every declared collider of the other's (a region), at their displayed world poses, by the native geometric contact query) and documents the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Measure whether two displayed bodies meet: the least signed separation, in metres, between every declared collider of one body's named segments (an effector, such as a striking surface) and every declared collider of the other's (a region), at their displayed world poses, by the native geometric contact query) directly over its typed inputs (`input`) as nested iteration of depth 2 (flatMap over side.profile.segments .filter((seg; filter over side.profile.segments; map over segment.shapes), delegating to `colliders`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 52 lines and 8 top-level statements that reuses `colliders` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (flatMap over side.profile.segments .filter((seg; filter over side.profile.segments; map over segment.shapes), performed once per call with 8 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 8 allocation sites become the returned value or die with the call, so nothing grows.
