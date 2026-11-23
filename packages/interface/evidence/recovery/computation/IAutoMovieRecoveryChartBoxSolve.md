# src/recovery/computation/IAutoMovieRecoveryChartBoxSolve.ts#IAutoMovieRecoveryChartBoxSolve.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Sparse symmetric Hessian rows; each entry stores a column index and its numeric coefficient. Assembled normalized right-hand-side values in the same unknown-slot order as the Hessian.

## @evidence contracts/development/design.md#principled-representation

Sparse symmetric Hessian rows; each entry stores a column index and its numeric coefficient.

## @evidence contracts/development/design.md#minimal-and-owned-surface

RecoveryChartBoxSolve, RecoveryChartFitSolve share IAutoMovieRecoveryChartBoxSolve's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Explicit positive numerical iteration ceiling; exhaustion remains a reported termination, not convergence.
