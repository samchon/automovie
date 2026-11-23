# src/geometry/IAutoMovieMinimizeMeshClearance.ts#IAutoMovieMinimizeMeshClearance.IResult

## @evidence contracts/development/design.md#principled-representation

Distances are nonnegative metres along the chosen positive axis and vertices retain original front-mesh identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

minimizeAutoMovieMeshClearance consumes all overlap witnesses and returns newly owned displacement entries for the caller to apply.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Negative or nonfinite clearance and incomplete solves refuse; results require remeasurement after skin propagation or Float32 conversion and do not certify volume collision freedom.

## @evidence contracts/development/common.md#meaningful-documentation

Solved forward-axis vertex travel restoring directional mesh clearance. Distances are nonnegative metres along the chosen positive axis and vertices retain original front-mesh identities.
