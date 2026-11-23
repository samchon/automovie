# src/film/propClearanceBounds.ts#propClearanceBounds

## @evidence contracts/development/implementation.md#principled-implementation

Composes the staged matrix once and bounds each affine box image through its eight corners using transformedBoxBounds. This is the exact-real axis-aligned bound of that image; binary64 products and sums can round or overflow, and malformed boxes are intentionally not admitted here. setPieceMatrix supplies the same TRS convention as staging without observing renderer pixels.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement and the box transform are the shared `setPieceMatrix` and `transformedBoxBounds`, so occupancy and clearance are measured under one rule and this file only pairs each box with its id.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No prop or clearance kind is special-cased, and a malformed box is transformed like any other so the validator, not this query, decides its fate.

## @evidence contracts/development/common.md#meaningful-documentation

States the order and the id carried, that rotation widens the box, why malformed boxes are kept, the empty answer, and the frame and unit of the result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the declared clearance count, with one matrix composition for the piece and a constant eight-corner fold per box.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The staged matrix is composed once and reused for every clearance box of the prop instead of once per box.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned boxes, one per declared clearance.
