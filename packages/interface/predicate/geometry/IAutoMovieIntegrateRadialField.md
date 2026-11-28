# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.IProps.sites

## @evidence contracts/development/common.md#meaningful-documentation

The property describes the borrowed dense population, its cap and the empty-list area and zero-integral behavior.

# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.ISite

## @evidence contracts/development/common.md#meaningful-documentation

The coordinates use one shared plane frame, with a signed perpendicular distance and the radius unit supplied by the caller.

## @evidence contracts/development/design.md#principled-representation

The radial kernel admits dense finite sites, a positive finite radius square and powers 2 or 3. It discards spheres that do not reach the plane before partitioning, and computes circle crossings at a normalized scale so similar configurations retain the same normalized integral and gradient.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A site carries its centre alone. Radius and exponent are common parameters of the integration.

# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.ISite.x

## @evidence contracts/development/common.md#meaningful-documentation

The coordinate follows the first planar axis in the footprint's length unit.

# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.ISite.y

## @evidence contracts/development/common.md#meaningful-documentation

The coordinate follows the second planar axis in the same length unit.

# src/geometry/IAutoMovieIntegrateRadialField.ts#IAutoMovieIntegrateRadialField.ISite.z

## @evidence contracts/development/common.md#meaningful-documentation

The signed perpendicular coordinate uses the same unit. Both signs give the same radial section.
