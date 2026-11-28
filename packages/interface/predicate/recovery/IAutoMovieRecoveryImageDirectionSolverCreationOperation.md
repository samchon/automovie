# src/recovery/IAutoMovieRecoveryImageDirectionSolverCreationOperation.ts#IAutoMovieRecoveryImageDirectionSolverCreationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation describes the inclusive direction-rank threshold, the reported ratio, and the input order expected by every subsequent solve.

## @evidence contracts/development/design.md#principled-representation

Reorthogonalized modified Gram-Schmidt builds a two-column QR factorization, and the two singular values of its triangular factor give the ratio used in admission. A degenerate first column, inadequate ratio, or mismatched right-hand-side length raises an error.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One closure owns the factored design for repeated solves. The caller supplies one row vector per view and assigns the returned coefficients their family-specific meaning.
