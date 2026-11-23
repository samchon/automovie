# src/human/generation/IAutoMovieHumanBodySurfaceLoft.ts#IAutoMovieHumanBodySurfaceLoft.HoleEdgeLoopPolygon

## @evidence contracts/development/common.md#meaningful-documentation

Closed trim polygon in the base chain's [station, phase] chart, using millimetres and radians. The hole-edge reader uses it to select the retained mesh boundary.

## @evidence contracts/development/design.md#principled-representation

Closed trim polygon in the base chain's [station, phase] chart, using millimetres and radians. The hole-edge reader uses it to select the retained mesh boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodySurfaceLoft.HoleEdgeLoopPolygon is the canonical exchange used by AutoMovieHumanBodySurfaceLoft.holeEdge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanBodySurfaceLoft input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/generation/IAutoMovieHumanBodySurfaceLoft.ts#IAutoMovieHumanBodySurfaceLoft.HoleEdgeResult

## @evidence contracts/development/common.md#meaningful-documentation

Corresponding mesh vertex indices and [station, phase] chart points for the selected hole edge, in the same cyclic order. Stations use millimetres and phases use radians.

## @evidence contracts/development/design.md#principled-representation

Corresponding mesh vertex indices and [station, phase] chart points for the selected hole edge, in the same cyclic order. Stations use millimetres and phases use radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodySurfaceLoft.HoleEdgeResult is the canonical exchange used by AutoMovieHumanBodySurfaceLoft.holeEdge.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanBodySurfaceLoft input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
