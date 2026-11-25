# src/core/math/IAutoMovieSolveQuadraticKernel.ts#IAutoMovieSolveQuadraticKernel.IInput

## @evidence contracts/development/design.md#principled-representation

Interval CSC arrays and diagonal convex objective coefficients describe one admitted quadratic problem; the result preserves original variable/row order and explicit solver statuses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The public quadratic adapter and the engine-owned kernel share input/result records while admission and numerical computation stay with their implementation owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional initial vector is compatibility data ignored by the cold solve; only status 1 admits a converged vector, and unavailable diagnostics may be NaN.

## @evidence contracts/development/common.md#meaningful-documentation

Documents sparse-array alignment, bound infinities, objective scaling, status meanings and unavailable results.

# src/core/math/IAutoMovieSolveQuadraticKernel.ts#IAutoMovieSolveQuadraticKernel.IResult

## @evidence contracts/development/design.md#principled-representation

Interval CSC arrays and diagonal convex objective coefficients describe one admitted quadratic problem; the result preserves original variable/row order and explicit solver statuses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The public quadratic adapter and the engine-owned kernel share input/result records while admission and numerical computation stay with their implementation owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional initial vector is compatibility data ignored by the cold solve; only status 1 admits a converged vector, and unavailable diagnostics may be NaN.

## @evidence contracts/development/common.md#meaningful-documentation

Documents sparse-array alignment, bound infinities, objective scaling, status meanings and unavailable results.
