# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed planar millimetre evaluator with an original parameter domain, chart breaks and explicit one-sided derivative queries.

## @evidence contracts/development/design.md#principled-representation

Curve approximation sorts mandatory breaks into smooth intervals and requests exact incident endpoint derivatives. It copies returned XY pairs for retained observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source owns parameterization and callback behavior. Fit budgets, independently measured error and saved coefficients belong to each consumer.

# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource.domain

## @evidence contracts/development/common.md#meaningful-documentation

Inclusive strictly increasing finite interval in the source's native parameter.

# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource.breaks

## @evidence contracts/development/common.md#meaningful-documentation

Finite parameter boundaries strictly inside the full interval. A fitted smooth piece cannot cross a declared break.

# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource.closed

## @evidence contracts/development/common.md#meaningful-documentation

Whether the source identifies the two ends of its full domain as one closed curve.

# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

Return one XY position in millimetres for the supplied source parameter.

# src/geometry/IAutoMoviePlanarCurveSource.ts#IAutoMoviePlanarCurveSource.derivative

## @evidence contracts/development/common.md#meaningful-documentation

Return an XY derivative of the requested order in millimetres per source parameter unit to that order. An explicit side selects the incident chart at a break.
