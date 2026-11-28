# src/geometry/IAutoMovieInterpolateMonotone.ts#IAutoMovieInterpolateMonotone.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Scalar abscissae and ordinates for a shape-preserving Hermite interpolant, with optional repeat length.

## @evidence contracts/development/design.md#principled-representation

The fitter limits adjacent slope ratios on each span so a segment stays within its endpoint values. Cyclic endpoints use period-spanning secants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The compiled interpolant owns copies of its knots and values. Input and output units remain the caller's choice.

# src/geometry/IAutoMovieInterpolateMonotone.ts#IAutoMovieInterpolateMonotone.IProps.knots

## @evidence contracts/development/common.md#meaningful-documentation

Nonempty finite strictly increasing abscissae. Query input and optional repeat length use this unit.

# src/geometry/IAutoMovieInterpolateMonotone.ts#IAutoMovieInterpolateMonotone.IProps.values

## @evidence contracts/development/common.md#meaningful-documentation

One finite ordinate per knot in the output unit. A single ordinate yields a constant profile.

# src/geometry/IAutoMovieInterpolateMonotone.ts#IAutoMovieInterpolateMonotone.IProps.period

## @evidence contracts/development/common.md#meaningful-documentation

Finite repeat length in knot units, requiring knots in [0, period). Omission holds endpoint values outside the open span.
