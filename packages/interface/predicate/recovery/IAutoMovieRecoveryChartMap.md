# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input

## @evidence contracts/development/common.md#meaningful-documentation

The input states the original vertex indexing, ordered triangle orientation, fixed coordinate domain and per-axis convergence settings.

## @evidence contracts/development/design.md#principled-representation

Unique undirected graph neighbors form the Laplacian. Every connected component needs at least one fixed boundary or guide coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input owns private observed incidence and anchors. The parameterizer returns only coordinates and numerical checks.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input.vertices

## @evidence contracts/development/common.md#meaningful-documentation

The solver allocates one adjacency set and returned parameter tuple per original vertex.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Triangle edges define neighbor sets. The original winding supplies the final signed UV area test.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input.fixed

## @evidence contracts/development/common.md#meaningful-documentation

Each graph component must connect to at least one fixed coordinate before iterative work.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input.tolerance

## @evidence contracts/development/common.md#meaningful-documentation

After stopping, the solver evaluates the original graph equations on reconstructed coordinates.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Input.maxIterations

## @evidence contracts/development/common.md#meaningful-documentation

U and V are solved separately, each with its own conjugate-gradient work limit.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result

## @evidence contracts/development/common.md#meaningful-documentation

The result gives source-order UV, two actual iteration counts and independent residual and triangle checks.

## @evidence contracts/development/design.md#principled-representation

Qualification requires every coordinate in the unit square, the original graph residual within tolerance and positive signed UV areas.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameterizer supplies observation coordinates. A chart drawing or surface compiler keeps source incidence ownership.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result.parameters

## @evidence contracts/development/common.md#meaningful-documentation

Fixed tuples are copied from their anchors, and the solver fills each free original vertex slot.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result.qualified

## @evidence contracts/development/common.md#meaningful-documentation

The result evaluates representable range and orientation independently of the iterative residual stop.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result.iterations

## @evidence contracts/development/common.md#meaningful-documentation

Each completed update is counted for its own coordinate. A fully fixed chart has zero updates.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result.residual

## @evidence contracts/development/common.md#meaningful-documentation

The owner recomputes degree times the vertex value minus all neighbor values on the final map.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result.failedTriangles

## @evidence contracts/development/common.md#meaningful-documentation

Each signed area uses the original triangle incidence and the returned UV coordinates.

# src/recovery/IAutoMovieRecoveryChartMap.ts#IAutoMovieRecoveryChartMap.Result.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The returned text records failed original equations, out-of-range coordinates or unresolved triangle orientations.
