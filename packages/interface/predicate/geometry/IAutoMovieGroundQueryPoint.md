# src/geometry/IAutoMovieGroundQueryPoint.ts#IAutoMovieGroundQueryPoint

## @evidence contracts/development/common.md#meaningful-documentation

Horizontal position in world metres for selecting a ground surface or sampling its height.

## @evidence contracts/development/design.md#principled-representation

Ground readers select footprints and evaluate terrain using world XZ, so the value carries the horizontal coordinates used by both.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record carries two position coordinates. Terrain supplies height and the owning query defines the absence behavior.

# src/geometry/IAutoMovieGroundQueryPoint.ts#IAutoMovieGroundQueryPoint.x

## @evidence contracts/development/common.md#meaningful-documentation

Finite X in the world metre frame of the queried footprint or heightfield.

# src/geometry/IAutoMovieGroundQueryPoint.ts#IAutoMovieGroundQueryPoint.z

## @evidence contracts/development/common.md#meaningful-documentation

Finite Z in that same world metre frame.
