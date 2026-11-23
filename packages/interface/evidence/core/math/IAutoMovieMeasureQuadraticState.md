# src/core/math/IAutoMovieMeasureQuadraticState.ts#IAutoMovieMeasureQuadraticState.IResult

## @evidence contracts/development/design.md#principled-representation

Homogeneous residual vectors retain solver-coordinate scaling while objective, gap and termination metrics explicitly undo their documented scaling; n and m dimensions remain solver premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieQuadraticState publishes the quantities the interior-point termination and certificate checks read, using one result contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Residuals and certificate quantities remain distinct; a reported cost or ratio alone is not convergence or admitted geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Documents residual signs, vector dimensions, objective units, normalization and homogeneous ratios.
