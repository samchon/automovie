# src/scene/human-polygon/createAutoMovieHumanPolygonFigure.ts#createAutoMovieHumanPolygonFigure

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (A posed polygon figure with its cartoon face: the original polygon drawing () built once from the evaluator's neutral output, and a face () on its actual head front) and documents the returned value as stated in this comment.

## @evidence contracts/development/implementation.md#principled-implementation

Implements the documented behavior (A posed polygon figure with its cartoon face: the original polygon drawing () built once from the evaluator's neutral output, and a face () on its actual head front) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `buildHumanPolygon`, `input.evaluate`, `drawing.setPose`, `JSON.stringify`, `buildHumanCartoonFace`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One operation of 45 lines and 6 top-level statements that reuses `buildHumanPolygon`, `input.evaluate`, `drawing.setPose`, `JSON.stringify`, `buildHumanCartoonFace` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
