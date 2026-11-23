# src/core/math/IAutoMovieSolveQuadraticProgram.ts#IAutoMovieSolveQuadraticProgram.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines the objective, alignment, numeric admission, ownership and ignored compatibility vector.

## @evidence contracts/development/design.md#principled-representation

A diagonal PSD objective and sparse interval rows preserve the original problem; null endpoints represent unbounded sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Solving, original-coordinate refinement and polishing share this program and the canonical row contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero coefficients and semidefinite diagonals remain unchanged; invalid scalars/holes are refused, and geometry acceptance tolerances stay with the caller.

# src/core/math/IAutoMovieSolveQuadraticProgram.ts#IAutoMovieSolveQuadraticProgram.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes status from original-row/gradient residuals and states ownership and acceptance responsibility.

## @evidence contracts/development/design.md#principled-representation

Bound excess and infinity-norm stationarity retain row and objective-gradient units, unlike normalized kernel residuals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical kernel result is extended only by the two original-problem measurements used in refinement and geometric solving.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Failed/incomplete statuses and vectors remain visible; objective decrease or finite residuals are not geometric validity certificates.
