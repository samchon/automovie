# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The primitive describes four ordered millimetre coefficients for each span and a common cumulative phase chart, with authored closure kept separately.

## @evidence contracts/development/design.md#principled-representation

The curve owner validates dense four-control spans and finite increasing cumulative widths. Evaluation uses degree-three Bernstein algebra for every span, then divides the derivative by its selected width.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The enclosing record shares identity and phase metadata with other curve primitives. Cubic spans own their four coefficients without carrying separate evaluators or sampled waypoints.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.type

## @evidence contracts/development/common.md#meaningful-documentation

The literal selects the cubic polynomial Bernstein path.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.name

## @evidence contracts/development/common.md#meaningful-documentation

The identity is nonblank at admission and remains available to source and inspection consumers.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.closed

## @evidence contracts/development/common.md#meaningful-documentation

The authored closure flag preserves the defined topology intent without furnishing geometric verification.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.unit

## @evidence contracts/development/common.md#meaningful-documentation

The literal records the coefficient's millimetre spatial unit.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.phaseUnit

## @evidence contracts/development/common.md#meaningful-documentation

Phase widths and reported derivatives share the selected independent parameter unit.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.phaseIntervals

## @evidence contracts/development/common.md#meaningful-documentation

The widths align one-to-one with spans and resolve the finite cumulative partition.

# src/geometry/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64.spans

## @evidence contracts/development/common.md#meaningful-documentation

Each entry gives exactly four ordered XYZ Bernstein control coefficients for that cubic span.
