# src/geometry/IAutoMovieLocateSurfaceCoordinate.ts#IAutoMovieLocateSurfaceCoordinate.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Sampled cage layout and a patch coordinate to resolve to an incident face and quad-local coordinates.

## @evidence contracts/development/design.md#principled-representation

Grid patches use direct row and column arithmetic. Transition patches search inverted bilinear corner maps in their stored face order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The query borrows layout and chart addresses. Position buffers and posed surface geometry play no role in its lookup.

# src/geometry/IAutoMovieLocateSurfaceCoordinate.ts#IAutoMovieLocateSurfaceCoordinate.IProps.cage

## @evidence contracts/development/common.md#meaningful-documentation

Sampled tier with valid patch grids and quad corner charts. Supply nondegenerate transition charts that give a reliable bilinear inverse.

# src/geometry/IAutoMovieLocateSurfaceCoordinate.ts#IAutoMovieLocateSurfaceCoordinate.IProps.coordinate

## @evidence contracts/development/common.md#meaningful-documentation

Existing patch ordinal with finite s and t in [0, 1]. Grid endpoints at one use the last face in that dimension.
