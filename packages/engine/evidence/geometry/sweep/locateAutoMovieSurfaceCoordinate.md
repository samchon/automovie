# src/geometry/sweep/locateAutoMovieSurfaceCoordinate.ts#locateAutoMovieSurfaceCoordinate

## @evidence contracts/development/implementation.md#principled-implementation

Inverting the even grid map of a structured block is exact: column and row are the integer parts of the scaled coordinates and the local coordinates their fractional parts; a non-grid band inverts each face's bilinear corner map, the map `mapAutoMovieSurfaceTier` applies, by Newton's method.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the per-patch grids the sampler publishes; only a non-grid band searches its own faces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coordinates outside a patch are refused instead of clamped onto its edge.

## @evidence contracts/development/common.md#meaningful-documentation

States the face rule, the boundary case, the local coordinate convention and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time on a grid: two products, two floors and one array read; on a band, at most 30 Newton steps per face of that band.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure lookup.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
