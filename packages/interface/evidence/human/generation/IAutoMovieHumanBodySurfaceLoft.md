# src/human/generation/IAutoMovieHumanBodySurfaceLoft.ts#IAutoMovieHumanBodySurfaceLoft

## @evidence contracts/development/common.md#meaningful-documentation

Describes hole-edge chart polygons and their corresponding emitted vertex-index lists; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Hole-edge chart polygons and their corresponding emitted vertex-index lists. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanBodySurfaceLoft; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing BodySurfaceLoft contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
