# src/math/equilibrateAutoMovieQuadraticProgram.ts#equilibrateAutoMovieQuadraticProgram

## @evidence contracts/development/implementation.md#principled-implementation

Ruiz infinity-norm equilibration scales the symmetric KKT data by reciprocal square-root column norms, with cumulative D/E/c in [1e-4,1e4]; zero rows retain identity scaling and all coefficients are multiplied rather than thresholded.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner mutates only its call-owned conic representation and records the inverse transformation for diagnostics and extraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No small coefficient, row or objective term is removed and no permanent regularizer enters P.

## @evidence contracts/development/common.md#meaningful-documentation

States the reversible coordinates, fixed inherited scaling bounds and independent residual ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ten passes cost O(n+m+nnz), with n+m temporary norm entries and no dense matrix or per-entry allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Norm workspaces are reused across the ten passes, while cumulative scalings preserve prior passes; no values survive another solve.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary norms are call-local and returned data retains only its existing arrays and scalar scales.
