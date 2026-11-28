# src/geometry/IAutoMovieInterpolateSpline.ts#IAutoMovieInterpolateSpline.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Scalar knots and optional repeat length for the sweep spline with sampled overshoot policy.

## @evidence contracts/development/design.md#principled-representation

The fitter scans interior span probes to choose one tension for a curvature-continuous profile. The maximum tension can be returned at the search limit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interpolant owns copied scalar data. Radius and scale callers apply their own positive-result conditions.

# src/geometry/IAutoMovieInterpolateSpline.ts#IAutoMovieInterpolateSpline.IProps.knots

## @evidence contracts/development/common.md#meaningful-documentation

Nonempty finite strictly increasing abscissae in the caller's knot unit.

# src/geometry/IAutoMovieInterpolateSpline.ts#IAutoMovieInterpolateSpline.IProps.values

## @evidence contracts/development/common.md#meaningful-documentation

One finite ordinate per knot, in the result unit. Positive inputs can produce negative between-knot values.

# src/geometry/IAutoMovieInterpolateSpline.ts#IAutoMovieInterpolateSpline.IProps.period

## @evidence contracts/development/common.md#meaningful-documentation

Finite repeat length requiring knots in [0, period). Omission gives open constant endpoint extension.
