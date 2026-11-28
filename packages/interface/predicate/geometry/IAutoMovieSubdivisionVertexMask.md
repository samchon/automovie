# src/geometry/IAutoMovieSubdivisionVertexMask.ts#IAutoMovieSubdivisionVertexMask

## @evidence contracts/development/common.md#meaningful-documentation

The mask describes the three contributors, their fan order and weight normalization.

## @evidence contracts/development/design.md#principled-representation

The kernel computes smooth, crease or corner rules from fan sharpness and interpolates if decay changes the selected rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One mask carries local weights only. Topology supplies the neighbors and refinement supplies face points.

# src/geometry/IAutoMovieSubdivisionVertexMask.ts#IAutoMovieSubdivisionVertexMask.vertex

## @evidence contracts/development/common.md#meaningful-documentation

The scalar multiplies the current parent vertex position.

# src/geometry/IAutoMovieSubdivisionVertexMask.ts#IAutoMovieSubdivisionVertexMask.edges

## @evidence contracts/development/common.md#meaningful-documentation

Each coefficient multiplies the far endpoint of the corresponding fan edge.

# src/geometry/IAutoMovieSubdivisionVertexMask.ts#IAutoMovieSubdivisionVertexMask.faces

## @evidence contracts/development/common.md#meaningful-documentation

Each coefficient multiplies the new point of the aligned fan face.
