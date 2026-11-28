# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory

## @evidence contracts/development/common.md#meaningful-documentation

The inventory identifies a candidate chart, the enclosing source component, vertex and triangle counts, boundary observation count and feature origin.

## @evidence contracts/development/design.md#principled-representation

Counts describe the admitted observed population at the inventory phase. The feature flag records an explicit crease-derived chart candidate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Inventory summarizes source chart preparation and does not carry mesh geometry into fitted output.

# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory.chart

## @evidence contracts/development/common.md#meaningful-documentation

Each feature candidate keeps its prepared chart name. The regular-chart path uses the interval-and-component-derived chart name.

# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory.component

## @evidence contracts/development/common.md#meaningful-documentation

Both inventory paths write the parent chart name built from the interval and connected source component. Feature candidates can share that parent while carrying distinct chart names.

# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory.vertices

## @evidence contracts/development/common.md#meaningful-documentation

The inventory takes the count from the prepared candidate position array, which uses chart-local vertices.

# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory.triangles

## @evidence contracts/development/common.md#meaningful-documentation

The regular and feature paths count their prepared local triangle arrays before fitting.

# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory.boundaryObservations

## @evidence contracts/development/common.md#meaningful-documentation

The producer sums the lengths of the ordered side observation lists. Repeated incidence at a shared corner contributes to each list that contains it.

# src/recovery/IAutoMovieRecoveryChartInventory.ts#IAutoMovieRecoveryChartInventory.feature

## @evidence contracts/development/common.md#meaningful-documentation

The crease-derived feature path writes true. The regular disk or cut-annulus path writes false.
