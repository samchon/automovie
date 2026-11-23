# src/drawing/projectAutoMovieDrawingPoint.ts#projectAutoMovieDrawingPoint

## @evidence contracts/development/implementation.md#principled-implementation

Orthographic projection as two dot products with the frame's in-plane axes, exact for the orthonormal basis `autoMovieDrawingFrame` returns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one world-to-page mapping every line, region corner, opening outline, dimension and note uses, so they share one page.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point or view is special-cased, and rounding is left to the callers that store the result so intermediate arithmetic stays exact.

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the projection, the axes, the unit, that depth is dropped and that the result is unrounded.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One subtraction and two dot products, so there is no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Two dot products per point; a cache keyed by point would cost a hash and an allocation to save less than it spends.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The temporary offset vector is dropped on return and the page point goes to the caller, which rounds it straight away.
