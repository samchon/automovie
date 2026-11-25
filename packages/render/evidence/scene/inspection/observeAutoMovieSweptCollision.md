# src/scene/inspection/observeAutoMovieSweptCollision.ts#observeAutoMovieSweptCollision

## @evidence contracts/development/common.md#meaningful-documentation

States the allowance rule, the exclusion and the unverified report.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates each affine capsule cell to the Engine sweep owner with the window active throughout the cell.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the cells with one report per cell.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No motion law is invented for a part without a certified cell.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each cell is capped by the remaining interval budget.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Cells are independent.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns plain data through the sinks.
