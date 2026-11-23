# src/geometry/sweep/IAutoMovieMapSurfaceTier.ts#IAutoMovieMapSurfaceTier.IProps

## @evidence contracts/development/design.md#principled-representation

Both cages share a dimensionless network chart; the source address must be quad-local with unit-interval coordinates. Ordered names and coordinate bounds are checked, but chart equivalence and corner=null remain caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

mapAutoMovieSurfaceTier composes canonical cage charts with locateAutoMovieSurfaceCoordinate instead of storing a separate correspondence table per tier pair.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Matching names is not proof of equal authored ranges; the source chart is interpolated without nearest-position snapping.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed inputs, actual matching checks, quad-only interpretation and chart preservation.

# src/geometry/sweep/IAutoMovieMapSurfaceTier.ts#IAutoMovieMapSurfaceTier.IResult

## @evidence contracts/development/design.md#principled-representation

The network coordinate retains patch s/t while at changes to the destination cage's quad face and u/v; all are dimensionless.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the shared chart address beside the destination subdivision address so consumers can retain either binding without reconstructing it again.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result reports a chart correspondence, not spatial coincidence between different subdivision tiers.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes destination and shared addresses and gives their independent mutable ownership.
