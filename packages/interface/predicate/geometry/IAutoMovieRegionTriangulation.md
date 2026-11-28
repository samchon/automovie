# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation

## @evidence contracts/development/common.md#meaningful-documentation

Canonical planar points, ring spans and counterclockwise triangles, with source correspondence and enclosed area.

## @evidence contracts/development/design.md#principled-representation

Canonicalization winds the outer and hole rings oppositely and copies each point. Ear clipping then bridges holes through existing index identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The receipt owns canonical geometry and the source permutation. Original metadata stays with the caller and can follow that permutation.

# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation.points

## @evidence contracts/development/common.md#meaningful-documentation

Owned copy of all ring coordinates in local XY metres. The counterclockwise outer ring comes first, followed by clockwise holes in input order.

# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation.sourceIndices

## @evidence contracts/development/common.md#meaningful-documentation

Source vertex permutation into the authored flattened rings. Each entry aligns with its canonical point, including when its ring was reversed.

# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation.rings

## @evidence contracts/development/common.md#meaningful-documentation

Contiguous spans into canonical points, outer first and holes in declared order.

# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based canonical point ordinals in groups of three. Each emitted triangle winds counterclockwise and faces local +Z.

# src/geometry/IAutoMovieRegionTriangulation.ts#IAutoMovieRegionTriangulation.area

## @evidence contracts/development/common.md#meaningful-documentation

Canonical signed area sum in square metres, adding the outer ring and subtracting every hole. Use finite authored region coordinates.
