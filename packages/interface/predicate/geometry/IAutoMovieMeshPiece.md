# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece

## @evidence contracts/development/common.md#meaningful-documentation

Topology and orientation summary of one edge-connected component after shared corner welding.

## @evidence contracts/development/design.md#principled-representation

The component pass joins nondegenerate triangles through undirected edges, records local fans and independently checks whether face flips could orient a manifold component.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result gives component counts, identity and orientation decisions. Weld maps and connectivity graphs stay with the measurement.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.firstTriangle

## @evidence contracts/development/common.md#meaningful-documentation

Lowest zero-based source triangle ordinal in the component. It orders the returned components.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.vertices

## @evidence contracts/development/common.md#meaningful-documentation

Number of distinct welded identities used by this component, using explicit physical identities when present.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.edges

## @evidence contracts/development/common.md#meaningful-documentation

Number of distinct undirected welded pairs among the component's triangles.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.faces

## @evidence contracts/development/common.md#meaningful-documentation

Count of triangles in this component after lattice-collapsed triangles are excluded.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.boundaryLoops

## @evidence contracts/development/common.md#meaningful-documentation

Count of connected components formed by edges used once. A closed component returns zero.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.euler

## @evidence contracts/development/common.md#meaningful-documentation

Euler characteristic computed from component counts as vertices minus edges plus faces.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.manifold

## @evidence contracts/development/common.md#meaningful-documentation

True when every edge has at most two uses and every component vertex has one triangle fan.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.orientable

## @evidence contracts/development/common.md#meaningful-documentation

Whether consistent face orientation is possible by selective flips. The test returns null for a nonmanifold component.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.consistentlyWound

## @evidence contracts/development/common.md#meaningful-documentation

Whether each multiply used edge has equal counts in both directions under the stored triangle ordering.

# src/geometry/IAutoMovieMeshPiece.ts#IAutoMovieMeshPiece.genus

## @evidence contracts/development/common.md#meaningful-documentation

Handle count derived from Euler characteristic and boundary count for an orientable manifold. Other components yield null.
