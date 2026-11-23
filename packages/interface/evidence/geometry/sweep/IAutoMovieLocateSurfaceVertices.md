# src/geometry/sweep/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices

## @evidence contracts/development/common.md#meaningful-documentation

Incident quad u/v addresses transfer to dimensionless network patch and sweep coordinates in supplied vertex order. Ordered patch names are checked, but callers must supply corresponding charts; shared physical edges can have different patch addresses.

## @evidence contracts/development/design.md#principled-representation

Incident quad u/v addresses transfer to dimensionless network patch and sweep coordinates in supplied vertex order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

locateAutoMovieSurfaceVertices consumes one sampled cage, network layout and canonical subdivision parameters.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ordered patch names are checked, but callers must supply corresponding charts; shared physical edges can have different patch addresses.

# src/geometry/sweep/IAutoMovieLocateSurfaceVertices.ts#IAutoMovieLocateSurfaceVertices.IProps

## @evidence contracts/development/design.md#principled-representation

Each quad-local subdivision address maps to dimensionless patch and optional sweep coordinates; locator admission checks face, corner discriminator and unit-interval coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

locateAutoMovieSurfaceVertices combines canonical network ranges, sampled cage charts and subdivision parameters for per-vertex surface fields without storing pose geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One supplied incident face determines each vertex address; seam consistency remains the field author's responsibility rather than being hidden by projection.

## @evidence contracts/development/common.md#meaningful-documentation

States ordering, empty results, borrowed inputs, actual network matching and the chart-to-display distinction.
