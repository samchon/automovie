# src/scene/inspection/followAutoMovieInspectionSource.ts#followAutoMovieInspectionSource

## @evidence contracts/development/common.md#meaningful-documentation

States the resulting placement, the optional inner transform and both preconditions.

## @evidence contracts/development/implementation.md#principled-implementation

The object's world matrix must equal the source's, so its local matrix is the inverse of its parent's world matrix times the source's world matrix.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy, the optional inner transform, the parent's inverse, then one world-matrix refresh.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parent's transform is cancelled instead of assumed to be the identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: at most two matrix products and one inversion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The curve and defect overlays both follow their source through this function.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One temporary matrix when the object has a parent; neither object is retained.
