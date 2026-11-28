# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology

## @evidence contracts/development/common.md#meaningful-documentation

Triangle census, edge incidence and signed volume from a mesh's stored buffers.

## @evidence contracts/development/design.md#principled-representation

The inspector detects triangle collapse on the position lattice, measures edge incidence with the shared weld rules, and computes signed volume from original triangle coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The topology summary reports counts and volume. The closedness and winding verdict takes an explicit policy in the validator.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Count of source triangles in the admitted index run, including lattice-collapsed triangles.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.degenerate

## @evidence contracts/development/common.md#meaningful-documentation

Count of triangles whose positions round onto fewer than three distinct lattice cells. Their edges are excluded.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.degenerateTriangles

## @evidence contracts/development/common.md#meaningful-documentation

Ascending zero-based source triangle ordinals for lattice-collapsed faces.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.boundaryEdges

## @evidence contracts/development/common.md#meaningful-documentation

Number of undirected welded edges used by exactly one noncollapsed triangle.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.nonManifoldEdges

## @evidence contracts/development/common.md#meaningful-documentation

Number of undirected welded edges used more than twice by noncollapsed triangles.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.watertight

## @evidence contracts/development/common.md#meaningful-documentation

True when a nonempty welded edge set has exactly two uses per edge. This is the edge-incidence measure.

# src/geometry/IAutoMovieMeshTopology.ts#IAutoMovieMeshTopology.volume

## @evidence contracts/development/common.md#meaningful-documentation

Signed sum of origin tetrahedron volumes from stored triangles, in cubic metres. A finite, closed, consistently wound surface gives the enclosed volume with its winding sign.
