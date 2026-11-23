# src/geometry/sweep/rigAutoMovieSurfaceCoons.ts#rigAutoMovieSurfaceCoons

## @evidence contracts/development/implementation.md#principled-implementation

Coons' bilinearly blended interpolation of four boundary curves, which reproduces every side exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The weights depend only on the grid, so they are stored once with their indices and the writer is a weighted sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No smoothing or relaxation is added to the interior.

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, its source and the grid layout.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight terms per interior point per pose, with no allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Indices and weights are computed once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains 17 numbers per interior point.
