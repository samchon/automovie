# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface

## @evidence contracts/development/common.md#meaningful-documentation

The surface explains packed quad connectivity, representative cage addresses, and independent sector-normal and UV indices. It states which buffers are shared by direct level evaluation.

## @evidence contracts/development/design.md#principled-representation

The ordinary subdivider returns child quads. Direct evaluation requires a stride of four per face before any limit work. It accepts level-zero quads and shares their geometry buffers. A nonquad source cage still supports ordinary refinement before evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result retains both generating and limit positions and the corner index streams needed by the renderer. It reuses level geometry buffers and owns newly evaluated arrays.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.positions

## @evidence contracts/development/common.md#meaningful-documentation

The packed XYZ values give generating controls in metres and can share the evaluated level's positions.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.limitPositions

## @evidence contracts/development/common.md#meaningful-documentation

The corresponding vertex-order XYZ limit values give the surface positions in metres.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.faces

## @evidence contracts/development/common.md#meaningful-documentation

The declared flat face stream uses four original vertex references per output quad in face order.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.normals

## @evidence contracts/development/common.md#meaningful-documentation

The packed triples provide unit limit normals, potentially multiple sectors for one vertex.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.normalFaces

## @evidence contracts/development/common.md#meaningful-documentation

Four normal references per quad align to position corners and can distinguish crease sectors.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.uvs

## @evidence contracts/development/common.md#meaningful-documentation

The optional packed UV values use the chart's coordinate range and are null with no UV data.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.uvFaces

## @evidence contracts/development/common.md#meaningful-documentation

The optional UV indices align to the corner population and are null together with UV values.

# src/geometry/IAutoMovieSubdivisionSurface.ts#IAutoMovieSubdivisionSurface.parameters

## @evidence contracts/development/common.md#meaningful-documentation

The new representative addresses select the first incident source cage chart per level vertex.
