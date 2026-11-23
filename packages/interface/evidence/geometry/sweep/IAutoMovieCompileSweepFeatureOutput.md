# src/geometry/sweep/IAutoMovieCompileSweepFeatureOutput.ts#IAutoMovieCompileSweepFeatureOutput

## @evidence contracts/development/design.md#principled-representation

Separates a dimensionless domain course from a metre displacement; angle arguments use radians while returned v uses turns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compileAutoMovieSweep reads displacement and exposes point through its feature query; prepareAutoMovieSurfaceConstruction reads that same course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two queries share the fitted course instead of substituting a sampled display polyline for the displacement curve.

## @evidence contracts/development/common.md#meaningful-documentation

Gives parameter units, callback lifetime, source retention, returned-record ownership and the feature admission owner.
