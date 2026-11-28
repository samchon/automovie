# src/geometry/IAutoMovieSubdivisionRing.ts#IAutoMovieSubdivisionRing

## @evidence contracts/development/common.md#meaningful-documentation

The ring specifies packed local positions, fan ordering, edge-to-diagonal incidence and the boundary cardinality rule.

## @evidence contracts/development/design.md#principled-representation

Level evaluation obtains centre, edge and diagonal points from the child's one-ring. Step and limit operators use the ordered sharpness values to compute local masks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ring holds only local geometry and sharpness. It does not own global cage connectivity or vertex identity.

# src/geometry/IAutoMovieSubdivisionRing.ts#IAutoMovieSubdivisionRing.centre

## @evidence contracts/development/common.md#meaningful-documentation

One XYZ point identifies the fan's central vertex.

# src/geometry/IAutoMovieSubdivisionRing.ts#IAutoMovieSubdivisionRing.edges

## @evidence contracts/development/common.md#meaningful-documentation

Packed XYZ values identify the edge neighbors in local fan order.

# src/geometry/IAutoMovieSubdivisionRing.ts#IAutoMovieSubdivisionRing.diagonals

## @evidence contracts/development/common.md#meaningful-documentation

Packed XYZ values identify the opposite corners of the incident quads in fan-face order.

# src/geometry/IAutoMovieSubdivisionRing.ts#IAutoMovieSubdivisionRing.sharpness

## @evidence contracts/development/common.md#meaningful-documentation

Each edge has one sharpness in the same order. On a boundary the first and last use 10.
