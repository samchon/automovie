# src/math/measureAutoMovieQuadraticState.ts#measureAutoMovieQuadraticState

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the unchanged quadratic homogeneous embedding and Goulart/Chen optimality/certificate residuals, undoing D/E/c scaling before normalized primal/dual norms and objective gaps are formed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner supplies both Newton residuals and honest diagnostic scalars; iteration owns decisions and the public adapter independently measures original interval feasibility and stationarity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Residuals use every original expanded coefficient and no tolerance, clipping or regularization changes them; infeasible objectives are marked separately during extraction.

## @evidence contracts/development/common.md#meaningful-documentation

States residual signs, coordinate reversal, costs, homogeneous certificate meaning and norm convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each measurement costs O(n+m+nnz) with n+m residual storage; stable norm accumulation avoids overflow without dense products.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each sparse matrix traversal supplies both equation and infeasibility residuals, and dot products serve cost, embedding and barrier calculations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned residual vectors belong to the current iteration and no history or global cache is retained.
