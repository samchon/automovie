# src/architecture/outlineCentroid.ts#outlineCentroid

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the shoelace centroid formula in binary64, with vertex-mean fallback below the doubled-area threshold. The ideal formula is winding independent for simple polygons; finite inputs alone do not prevent intermediate overflow/cancellation, and this helper does not certify containment of the resulting point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One planar helper beside `outlineHull` and `polygonBounds`, so the envelope query reads a face centroid without carrying a private copy of the formula.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no face or caller; the degenerate threshold is the shared observation tolerance, applied to every outline alike.

## @evidence contracts/development/common.md#meaningful-documentation

States the closing rule, that winding does not matter, the degenerate threshold and its fallback, and the `NaN` answer for an empty outline.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the outline's points, plus a second pass only in the degenerate fallback, with constant extra space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one outline that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the one returned point.
