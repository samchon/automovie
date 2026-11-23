# src/architecture/IAutoMovieConnectorGeometry.ts#IAutoMovieConnectorGeometry

## @evidence contracts/development/design.md#principled-representation

Records binary64 polyline measurements: summed horizontal/3D segment lengths, endpoint net rise and `atan2(|rise|, run)`. These are computed route metrics, not exact-real values; finite source coordinates alone do not guarantee finite derived arithmetic, which callers must account for.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Groups the scalar figures with the stations and landings placed on the same arc length, so a caller reads the whole traversal shape from one call instead of re-walking the route.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The route-average slope and net rise are stated as such rather than replaced by a steepest-segment figure for some consumer, and a degenerate route throws instead of reporting zero lengths.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and its refusals, the up axis, how rise, run and slope are computed and that slope is a route average, the net-rise limitation of a climb that descends, and the metre and radian units with the slope's range.
