# src/geometry/sweep/IAutoMovieLocateSurfaceCoordinate.ts#IAutoMovieLocateSurfaceCoordinate.IProps

## @evidence contracts/development/design.md#principled-representation

Dimensionless patch s/t addresses are separate from cage-face u/v; the locator checks patch presence and [0,1] bounds before chart inversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

mapAutoMovieSurfaceTier reuses this locator on its destination cage; canonical cage and coordinate contracts own the topology and chart data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The lookup uses supplied patch charts rather than inferring correspondence from spatial proximity; non-grid inversion can refuse an unmatched coordinate.

## @evidence contracts/development/common.md#meaningful-documentation

Gives quad convention, borrowed chart ownership, range admission and lookup failure.
