# src/geometry/IAutoMovieCompileSweepFeatureOutput.ts#IAutoMovieCompileSweepFeatureOutput

## @evidence contracts/development/common.md#meaningful-documentation

The result describes the compiled course and analytic radial kernel shared by sweep evaluation and construction observations.

## @evidence contracts/development/design.md#principled-representation

The kernel and observer close over the same compiled feature curve. Both use the fitted course rather than an independently sampled approximation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The returned field and point evaluation share prepared state. The point value uses the same public IFeaturePoint as the surface consumer.

# src/geometry/IAutoMovieCompileSweepFeatureOutput.ts#IAutoMovieCompileSweepFeatureOutput.displacement

## @evidence contracts/development/common.md#meaningful-documentation

The callback states its input and output units, derivative fields, and certification and no-effect behavior.

# src/geometry/IAutoMovieCompileSweepFeatureOutput.ts#IAutoMovieCompileSweepFeatureOutput.point

## @evidence contracts/development/common.md#meaningful-documentation

The callback describes clamped knot-span share, constant collapse, and unwrapped turns, with fitted coordinate overshoot documented on IFeaturePoint.
