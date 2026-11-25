# src/geometry/sweep/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices.IProps

## @evidence contracts/development/design.md#principled-representation

Each quad-local subdivision address maps to dimensionless patch and optional sweep coordinates; locator admission checks face, corner discriminator and unit-interval coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

locateAutoMovieSurfaceVertices combines canonical network ranges, sampled cage charts and subdivision parameters for per-vertex surface fields without storing pose geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One supplied incident face determines each vertex address; seam consistency remains the field author's responsibility rather than being hidden by projection.

## @evidence contracts/development/common.md#meaningful-documentation

States ordering, empty results, borrowed inputs, actual network matching and the chart-to-display distinction.
