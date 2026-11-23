# src/recovery/computation/IAutoMovieRecoveryObservedMeshTopology.ts#IAutoMovieRecoveryObservedMeshTopology

## @evidence contracts/development/common.md#meaningful-documentation

Incidence and measured geometry of one admitted private feature-cut mesh. Per-vertex/face arrays share the supplied mesh indexing; areas are square millimetres and normals are unit vectors in the registered frame. Maps and arrays are producer-owned mutable topology results.

## @evidence contracts/development/design.md#principled-representation

Per-vertex/face arrays share the supplied mesh indexing; areas are square millimetres and normals are unit vectors in the registered frame. Maps and arrays are producer-owned mutable topology results.

## @evidence contracts/development/design.md#minimal-and-owned-surface

RecoveryFeatureChartCutsTopology produces this shared record for original, subdivided and fan-materialized meshes; subdivision and seam publication read the same owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The observer refuses invalid incidence rather than welding or repairing it. These source observations are not generated coefficient topology.
