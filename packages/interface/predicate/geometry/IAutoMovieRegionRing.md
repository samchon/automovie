# src/geometry/IAutoMovieRegionRing.ts#IAutoMovieRegionRing

## @evidence contracts/development/common.md#meaningful-documentation

Contiguous span occupied by one canonical planar ring in the shared point array.

## @evidence contracts/development/design.md#principled-representation

Canonical region copies coordinates, normalizes outer and hole winding, then appends outer first and each hole in declaration order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The span shares the region point array and needs only its starting ordinal and length. Source order mapping stays in sourceIndices.

# src/geometry/IAutoMovieRegionRing.ts#IAutoMovieRegionRing.start

## @evidence contracts/development/common.md#meaningful-documentation

Zero-based point ordinal in the canonical region. The outer boundary starts at zero.

# src/geometry/IAutoMovieRegionRing.ts#IAutoMovieRegionRing.count

## @evidence contracts/development/common.md#meaningful-documentation

Number of listed vertices in the ring span, at least three. Closure uses the first point again by index.
