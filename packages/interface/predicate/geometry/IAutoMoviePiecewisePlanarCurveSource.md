# src/geometry/IAutoMoviePiecewisePlanarCurveSource.ts#IAutoMoviePiecewisePlanarCurveSource

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed planar evaluator augmented with interior source-knot observation locations.

## @evidence contracts/development/design.md#principled-representation

Compact fitting inserts source knots into its fitting and held-out sampling schedule. The inherited mandatory breaks alone partition smooth charts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The extension adds observation positions to the existing source callbacks. Accepted output pieces use their own discovered partition.

# src/geometry/IAutoMoviePiecewisePlanarCurveSource.ts#IAutoMoviePiecewisePlanarCurveSource.knots

## @evidence contracts/development/common.md#meaningful-documentation

Source piece boundaries strictly inside the domain, used for observation coverage rather than compulsory fitted splits.
