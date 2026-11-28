# src/geometry/IAutoMovieSelectTriangleRegion.ts#IAutoMovieSelectTriangleRegion.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Connectivity and an oriented boundary for selecting one side of a mesh patch.

## @evidence contracts/development/design.md#principled-representation

The selector follows the directed boundary's inward triangle uses, floods across shared edges and validates the edge barrier after flooding.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only vertex identities and orientation decide the selected original triangle ordinals. Position buffers remain outside the operation.

# src/geometry/IAutoMovieSelectTriangleRegion.ts#IAutoMovieSelectTriangleRegion.IProps.indices

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed nonnegative safe-integer vertex identities in groups of three, distinct within each face. Shared edges have at most two oppositely wound uses.

# src/geometry/IAutoMovieSelectTriangleRegion.ts#IAutoMovieSelectTriangleRegion.IProps.boundary

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed oriented loop of at least three distinct nonnegative safe-integer vertex identities. The a-to-b direction selects the face with the same directed edge.
