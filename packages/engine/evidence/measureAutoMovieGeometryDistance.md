# src/measureAutoMovieGeometryDistance.ts#measureAutoMovieGeometryDistance

## @evidence contracts/development/implementation.md#principled-implementation

Resolves both selectors through the shared actor reader then takes the norm of their difference, preserving pose-root and node affine stages for bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The distance branch owns time admission and subtraction; selector record ownership and sampling stay in the shared reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Finite nonnegative explicit time is required; unresolved or ambiguous records refuse rather than selecting an arbitrary actor or returning zero.

## @evidence contracts/development/common.md#meaningful-documentation

States world-metre output and invalid-time or selector failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two selector resolutions dominate cost: landmark scans or actor/model scans plus FK for bone selectors; subtraction and norm are constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The two selectors share a reader over current records but no cross-call memoized geometry; differing actors and times remain independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader and resolved points are call-local; the returned distance scalar retains no compiled records or handles.
