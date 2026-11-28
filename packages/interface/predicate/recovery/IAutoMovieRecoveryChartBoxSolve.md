# src/recovery/IAutoMovieRecoveryChartBoxSolve.ts#IAutoMovieRecoveryChartBoxSolve.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The contract states the positive-semidefinite premise, sparse address and component order, finite limits, warm-start conditions and the numerical stop result.

## @evidence contracts/development/design.md#principled-representation

Diagonal congruence scales each positive Gram coordinate together with its box. Exact zero rows need zero right-hand sides and retain feasible initial values. Stopping is evaluated in the original normalized coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The solver owns numerical iteration and the feasible iterate. The fit owner owns the Gram premise, geometric residuals and sampled qualification.
