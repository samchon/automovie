# src/drawing/autoMovieDrawingPolygonArea.ts#autoMovieDrawingPolygonArea

## @evidence contracts/development/implementation.md#principled-implementation

The shoelace formula through `polygonDoubleArea`, halved and made unsigned, which is exact for a simple polygon; the drafter only passes convex cell sections, so the self-crossing limitation never applies to its inputs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A page-polygon reading of the engine's single shoelace implementation, so the drawing has no second area formula to drift from the architecture code.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No polygon is special-cased; a degenerate ring yields zero because the shoelace sum of fewer than three corners is zero, not through a guard.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the unit, the closing convention, winding independence, the degenerate result and the simple-polygon premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the `n` corners, linear time and constant space, which is the minimum for an area that depends on every corner.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function evaluated once per drafted region; nothing equivalent repeats.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Delegates to a fold that keeps one running sum on the stack, so the area call holds no object between invocations.
