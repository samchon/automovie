# src/physics/IAutoMovieSolvePhysicalTargetStep.ts#IAutoMovieSolvePhysicalTargetStep.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Finite residual Jacobian and box-constrained coordinates for one damped linear search direction.

## @evidence contracts/development/design.md#principled-representation

Each column has errors.length rows and corresponds to one coordinate; at most 64 columns are allowed. Damping is positive in the Jacobian's singular-value units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalTargetStep borrows arrays and returns a new coordinate-delta vector; the nonlinear caller owns applying it, clamping candidate coordinates and backtracking against actual residuals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The producer rejects empty/nonfinite errors, mismatched dimensions, invalid bounds or an out-of-bounds current value. Zero columns or fixed coordinates yield zero directions rather than guaranteed progress.
