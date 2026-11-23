# src/geometry/construction/AutoMovieConstructionContinuationRealize.ts#AutoMovieConstructionContinuationRealize

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Retain a continuation only while both actual open ends survive its subtree) as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (Retain a continuation only while both actual open ends survive its subtree) directly over its typed inputs (`node`, `body`, `state`, `walk`, `report`) as a fixed number of statements with no loop or recursion in the body, delegating to `walk`, `report`, `cut`, `AutoMovieConstructionState.snap`, `previous.apply`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 63 lines and 12 top-level statements that reuses `walk`, `report`, `cut`, `AutoMovieConstructionState.snap`, `previous.apply` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `node`, `body`, `state`, `walk`, `report`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
