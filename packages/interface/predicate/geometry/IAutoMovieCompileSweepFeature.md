# src/geometry/IAutoMovieCompileSweepFeature.ts#IAutoMovieCompileSweepFeature.IScale

## @evidence contracts/development/common.md#meaningful-documentation

Metre length and radius scales for compiling a feature course in the sweep's cylindrical coordinates.

## @evidence contracts/development/design.md#principled-representation

The spline's chord distances combine normalized spine differences scaled by polygon length and wrapped angle differences scaled by the mean unscaled radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This compile-time pair supplies the knot metric. Displacement queries use their own local radius without rewriting these scales.

# src/geometry/IAutoMovieCompileSweepFeature.ts#IAutoMovieCompileSweepFeature.IScale.length

## @evidence contracts/development/common.md#meaningful-documentation

Spine control-polygon length in metres, multiplying normalized chord differences for feature-knot spacing.

# src/geometry/IAutoMovieCompileSweepFeature.ts#IAutoMovieCompileSweepFeature.IScale.radius

## @evidence contracts/development/common.md#meaningful-documentation

Mean unscaled metre radius of the authored station samples, multiplying angle differences in radians during course compilation.
