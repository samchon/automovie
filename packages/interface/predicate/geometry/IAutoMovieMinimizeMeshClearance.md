# src/geometry/IAutoMovieMinimizeMeshClearance.ts#IAutoMovieMinimizeMeshClearance.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result describes the measured inequality problem, normalized solve tolerance, refusal cases and the meaning of no returned vertices.

## @evidence contracts/development/design.md#principled-representation

The solver forms constraints from every overlap witness, derives per-vertex caps from positive deficits, and refuses an infeasible or incomplete solve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The output lists travel for retained original vertex identities. Both source meshes stay owned by the caller.

# src/geometry/IAutoMovieMinimizeMeshClearance.ts#IAutoMovieMinimizeMeshClearance.IVertexTravel

## @evidence contracts/development/common.md#meaningful-documentation

The record gives the original front vertex ordinal, its travel, the selected positive axis and downstream remeasurement responsibility.

## @evidence contracts/development/design.md#principled-representation

The solver assembles only vertices with positive-deficit incidents, retains solved zeros and sorts the output by original ordinal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vertex record carries one directional metre distance. Applying it and remeasuring after propagation remain the caller's responsibility.

# src/geometry/IAutoMovieMinimizeMeshClearance.ts#IAutoMovieMinimizeMeshClearance.IVertexTravel.vertex

## @evidence contracts/development/common.md#meaningful-documentation

The ordinal refers back to the original front mesh and permits zero solved travel for a selected vertex.

# src/geometry/IAutoMovieMinimizeMeshClearance.ts#IAutoMovieMinimizeMeshClearance.IVertexTravel.distance

## @evidence contracts/development/common.md#meaningful-documentation

The travel is nonnegative along the chosen positive axis, in metres, and bounded by the incident deficit.
