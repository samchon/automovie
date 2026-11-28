# src/geometry/IAutoMovieMeshCrossingOptions.ts#IAutoMovieMeshCrossingOptions

## @evidence contracts/development/common.md#meaningful-documentation

Controls pair retention and transverse witness admission for the triangle crossing query.

## @evidence contracts/development/design.md#principled-representation

The strict segment and interior tests use an optional normalized margin. The caller's point classifier then decides each admitted transverse witness individually.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record stores census and contact policy. Geometry, hierarchy and output classifications are supplied separately.

# src/geometry/IAutoMovieMeshCrossingOptions.ts#IAutoMovieMeshCrossingOptions.allPairs

## @evidence contracts/development/common.md#meaningful-documentation

True retains each admitted crossing pair. Omission keeps one witness per first triangle and prefers a transverse witness over a coplanar one.

# src/geometry/IAutoMovieMeshCrossingOptions.ts#IAutoMovieMeshCrossingOptions.interiorTolerance

## @evidence contracts/development/common.md#meaningful-documentation

Finite dimensionless margin in [0, 0.5) applied to segment and triangle interior coordinates. Omission uses zero.

# src/geometry/IAutoMovieMeshCrossingOptions.ts#IAutoMovieMeshCrossingOptions.acceptTransversePoint

## @evidence contracts/development/common.md#meaningful-documentation

Optional classifier for each admitted transverse intersection point in the common metre frame. Its two ordinals address the original first and second meshes.
