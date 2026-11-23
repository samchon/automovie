# src/soft/IAutoMovieSoftSolver.ts#IAutoMovieSoftSolver

## @evidence contracts/development/design.md#principled-representation

The CPU solver predicts velocity with implicit linear drag, applies the selected number of Jacobi stiffness sweeps, or of compliant XPBD sweeps when compliance is declared, and integrates only integer absolute steps; validation checks finite values and the authored travel number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Numerical settings and bounded seek work live beside the domain instead of being inferred from playback frame rate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

referenceSpeed is an author-supplied design speed used in admission, not a runtime speed clamp or a continuous collision certificate; maxSpeed reports the resulting solve separately.

## @evidence contracts/development/common.md#meaningful-documentation

Members give seconds, acceleration, inverse-second drag, dimensionless stiffness, iteration count and the maximum absolute integration step.
