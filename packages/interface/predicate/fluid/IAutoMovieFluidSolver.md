# src/fluid/IAutoMovieFluidSolver.ts#IAutoMovieFluidSolver

## @evidence contracts/development/common.md#meaningful-documentation

The documented step is in seconds, gravity in m/s², drag in inverse seconds and depths in metres. The design depth bounds initial water and supplies the validator's Courant premise.

## @evidence contracts/development/design.md#principled-representation

One fixed clock and the authored gravity, drag and thresholds parameterize a domain. Scalar types preserve numeric authoring, while validateFluidDomain admits finite positive fields, nonnegative drag and dry depth, and the declared step budget.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fixed-step solver consumes the clock, gravity and drag per step. Domain admission consumes reference depth and maximum steps, while wetting uses dryDepth. The record carries no runtime state.
