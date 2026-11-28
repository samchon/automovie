# src/geometry/IAutoMovieSurfaceCoordinate.ts#IAutoMovieSurfaceCoordinate

## @evidence contracts/development/common.md#meaningful-documentation

Tier-independent chart address within one surface network patch.

## @evidence contracts/development/design.md#principled-representation

Tier lookup resolves the same s and t against a selected cage layout. Vertex location reconstructs them from stored quad corner charts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The address uses patch identity and two normalized chart scalars. Cages own faces, subdivisions and world positions.

# src/geometry/IAutoMovieSurfaceCoordinate.ts#IAutoMovieSurfaceCoordinate.patch

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based ordinal in the network's ordered patch table.

# src/geometry/IAutoMovieSurfaceCoordinate.ts#IAutoMovieSurfaceCoordinate.s

## @evidence contracts/development/common.md#meaningful-documentation

Normalized across-patch coordinate in [0, 1], aligned with grid columns when present.

# src/geometry/IAutoMovieSurfaceCoordinate.ts#IAutoMovieSurfaceCoordinate.t

## @evidence contracts/development/common.md#meaningful-documentation

Normalized along-patch coordinate in [0, 1], aligned with grid rows when present.
