# src/geometry/IAutoMovieRegisteredConicArc.ts#IAutoMovieRegisteredConicArc

## @evidence contracts/development/common.md#meaningful-documentation

The record describes positive-weight rational quadratic controls, the independent local parameter and sampled source discrepancy.

## @evidence contracts/development/design.md#principled-representation

Recovery registers the fitted arc to its source interval and writes ordered millimetre controls with one middle weight. The independent conic reader evaluates in normalized t with endpoint weights one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record carries two-dimensional rational geometry and its source address. Source derivative and length estimates remain independent.

# src/geometry/IAutoMovieRegisteredConicArc.ts#IAutoMovieRegisteredConicArc.domain

## @evidence contracts/development/common.md#meaningful-documentation

The tuple preserves the fitted arc's original source interval and leaves local t independent.

# src/geometry/IAutoMovieRegisteredConicArc.ts#IAutoMovieRegisteredConicArc.controls

## @evidence contracts/development/common.md#meaningful-documentation

The sequence gives start, middle projective control and end in one millimetre chart. The straight fallback can use the endpoint midpoint.

# src/geometry/IAutoMovieRegisteredConicArc.ts#IAutoMovieRegisteredConicArc.weight

## @evidence contracts/development/common.md#meaningful-documentation

The finite positive middle Bernstein term uses this weight. Both endpoint weights are one.

# src/geometry/IAutoMovieRegisteredConicArc.ts#IAutoMovieRegisteredConicArc.maximumSampleErrorMm

## @evidence contracts/development/common.md#meaningful-documentation

The value is the largest discrepancy observed at the method's samples in millimetres.
