# src/geometry/IAutoMoviePreparedSpace.ts#IAutoMoviePreparedSpace

## @evidence contracts/development/common.md#meaningful-documentation

Reusable footprints for the authored surfaces of one space, kept in their original order.

## @evidence contracts/development/design.md#principled-representation

Preparation builds each surface's outer and hole footprint once. The point query still walks containing candidates and evaluates their current source heights.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared view retains source space identity and prepared geometry. Terrain policy and walkability remain with the authored space.

# src/geometry/IAutoMoviePreparedSpace.ts#IAutoMoviePreparedSpace.space

## @evidence contracts/development/common.md#meaningful-documentation

The original space reference whose surfaces supplied the footprint preparation. Use this prepared view with that space.

# src/geometry/IAutoMoviePreparedSpace.ts#IAutoMoviePreparedSpace.surfaces

## @evidence contracts/development/common.md#meaningful-documentation

One prepared footprint and source reference per authored surface, in source order. Rebuild if a source polygon or its holes change.
