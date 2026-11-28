# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit

## @evidence contracts/development/common.md#meaningful-documentation

The hit identifies local geometric separation and uses the boundary flag to distinguish open-sheet rim readings from oriented interior readings.

## @evidence contracts/development/design.md#principled-representation

The query admits finite source and query XYZ. It selects a nearest face, edge or vertex, copies the point and computes the local pseudonormal sign. It refuses unresolved arithmetic before a working sentinel can escape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The observation carries one nearest feature and its local qualification. The surface owner retains topology and any closed-volume interpretation.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.point

## @evidence contracts/development/common.md#meaningful-documentation

The caller owns the copied XYZ surface position in the mesh-local metre frame.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.normal

## @evidence contracts/development/common.md#meaningful-documentation

The unit pseudonormal uses the selected face, incident edge faces or angle-weighted vertex contributions, including the single face at a rim edge.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.distance

## @evidence contracts/development/common.md#meaningful-documentation

The scalar gives Euclidean metres between the query and its nearest point.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.signedDistance

## @evidence contracts/development/common.md#meaningful-documentation

The scalar uses the local pseudonormal sign. A negative value has closed-volume meaning only under the stated surface premises.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.triangle

## @evidence contracts/development/common.md#meaningful-documentation

The ordinal addresses the original index buffer and resolves nearest-distance ties by the smallest original ordinal.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.feature

## @evidence contracts/development/common.md#meaningful-documentation

The discriminant describes face interior, edge interior or corner support, corresponding to the selected nearest geometry.

# src/geometry/IAutoMovieSignedMeshQueryHit.ts#IAutoMovieSignedMeshQueryHit.boundary

## @evidence contracts/development/common.md#meaningful-documentation

The flag marks an open sheet's rim edge or vertex. Closed surfaces always report false.
