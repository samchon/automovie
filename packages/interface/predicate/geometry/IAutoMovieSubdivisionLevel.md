# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel

## @evidence contracts/development/common.md#meaningful-documentation

The level explains its separate vertex, corner address and UV buffers and the quad sub-face sentinel.

## @evidence contracts/development/design.md#principled-representation

Admission allocates level zero. Refinement creates child quads and propagates chart addresses from parent corners. Evaluation exports a first incident address per vertex and translates the quad sentinel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The level owns geometry and parallel arrays for one topology. Render normals and per-side limit evaluation remain separate outputs.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.topology

## @evidence contracts/development/common.md#meaningful-documentation

The topology stores current compressed connectivity and edge sharpness independently from coordinate values.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.positions

## @evidence contracts/development/common.md#meaningful-documentation

Each packed XYZ control triple is in the common local metre frame.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.uvs

## @evidence contracts/development/common.md#meaningful-documentation

The optional packed value array is null when the cage carries no texture coordinates.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.cornerUvs

## @evidence contracts/development/common.md#meaningful-documentation

Indices align with face-corner ordering and are null together with the UV array.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.cage

## @evidence contracts/development/common.md#meaningful-documentation

True marks the unrefined admitted level and allows the first refinement to split nonquad face charts.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.parameterFaces

## @evidence contracts/development/common.md#meaningful-documentation

Every current face corner retains the corresponding original cage polygon ordinal.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.parameterCorners

## @evidence contracts/development/common.md#meaningful-documentation

Every current corner retains the nonquad chart index or the quad sentinel -1.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.parameterU

## @evidence contracts/development/common.md#meaningful-documentation

The array gives the first local coordinate in each retained chart.

# src/geometry/IAutoMovieSubdivisionLevel.ts#IAutoMovieSubdivisionLevel.parameterV

## @evidence contracts/development/common.md#meaningful-documentation

The array gives the second local coordinate in each retained chart.
