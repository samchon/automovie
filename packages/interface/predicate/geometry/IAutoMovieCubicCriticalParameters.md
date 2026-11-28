# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters

## @evidence contracts/development/common.md#meaningful-documentation

Numerical candidates for isolated planar cubic critical parameters on the open normalized span.

## @evidence contracts/development/design.md#principled-representation

The solver derives curvature numerator and affine-critical polynomials from the source controls and tests velocity root candidates in both coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result lists candidate categories and degeneracy diagnostics, while controls and root isolation stay with the caller.

# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters.breaks

## @evidence contracts/development/common.md#meaningful-documentation

Sorted union of the three candidate arrays, merging numerically identical parameter values.

# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters.zeroCurvature

## @evidence contracts/development/common.md#meaningful-documentation

Interior roots of the cross product of velocity and acceleration. The candidates include potential inflections, repeated roots and stationary points.

# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters.affineCritical

## @evidence contracts/development/common.md#meaningful-documentation

Interior roots of the affine-curvature candidate equations for a regular subarc. Categories may overlap.

# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters.stationary

## @evidence contracts/development/common.md#meaningful-documentation

Interior velocity common-root candidates whose residuals pass the numerical checks for both components.

# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters.collinear

## @evidence contracts/development/common.md#meaningful-documentation

True when the computed curvature-numerator coefficients all vanish.

# src/geometry/IAutoMovieCubicCriticalParameters.ts#IAutoMovieCubicCriticalParameters.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Numerical root qualifications and degenerate cases such as constant curves or curvature continua.
