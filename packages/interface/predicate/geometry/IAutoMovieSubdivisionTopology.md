# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology

## @evidence contracts/development/common.md#meaningful-documentation

The record documents face-corner packing, directed edge adjacency and ordered vertex fans including the open-boundary end rules.

## @evidence contracts/development/design.md#principled-representation

The topology owner builds offsets, tracks paired edge uses and rejects disconnected fans. Vertex and UV refinement use the same corner addresses without reconstructing adjacency.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Parallel arrays encode one connectivity graph. Coordinates and UV values stay in their respective level arrays.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.vertexCount

## @evidence contracts/development/common.md#meaningful-documentation

The count defines the original vertex index range and fan-row population at this level.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.faceOffsets

## @evidence contracts/development/common.md#meaningful-documentation

Each face starts at its offset, with a terminal offset immediately after the last corner.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.faceVertices

## @evidence contracts/development/common.md#meaningful-documentation

The array maps each packed corner to one geometry vertex.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.cornerFaces

## @evidence contracts/development/common.md#meaningful-documentation

Each packed corner stores its owning polygon ordinal.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.cornerEdges

## @evidence contracts/development/common.md#meaningful-documentation

Each packed corner stores the ordinal of its edge toward the next corner of that polygon.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.edgeVertices

## @evidence contracts/development/common.md#meaningful-documentation

The two endpoints follow the first incident corner's direction.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.edgeCorners

## @evidence contracts/development/common.md#meaningful-documentation

The two entries identify opposing edge uses, with -1 in the second slot for a boundary.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.edgeSharpness

## @evidence contracts/development/common.md#meaningful-documentation

The array aligns authored or decayed sharpness to edge ordinals. Boundary edges carry the permanent value 10.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.fanEdgeOffsets

## @evidence contracts/development/common.md#meaningful-documentation

One compressed row per vertex addresses its ordered edges and a terminal offset closes the last row.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.fanEdges

## @evidence contracts/development/common.md#meaningful-documentation

The entries traverse each fan in the orientation defined by the incident faces.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.fanCornerOffsets

## @evidence contracts/development/common.md#meaningful-documentation

One compressed row per vertex addresses its incident corners, with a final sentinel offset.

# src/geometry/IAutoMovieSubdivisionTopology.ts#IAutoMovieSubdivisionTopology.fanCorners

## @evidence contracts/development/common.md#meaningful-documentation

The corner sequence aligns with the fan-edge walk and closes cyclically only for the interior case.
