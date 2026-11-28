# src/geometry/IAutoMovieFootprintInteriorPoint.ts#IAutoMovieFootprintInteriorPoint.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result states its null condition, new coordinate storage and arithmetic vertex-mean construction.

## @evidence contracts/development/design.md#principled-representation

The Engine selects the first positive-area convex piece with the largest area and returns its planar vertex mean. No positive-area piece yields null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The returned optional value contains the plan coordinates only. The surface owner evaluates height separately.

# src/geometry/IAutoMovieFootprintInteriorPoint.ts#IAutoMovieFootprintInteriorPoint.IAnchor

## @evidence contracts/development/common.md#meaningful-documentation

The point identifies an interior plan anchor and documents world metre units and vertex averaging.

## @evidence contracts/development/design.md#principled-representation

The owner sums X and Z over the selected convex piece and divides each sum by its vertex count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The coordinate record carries two world-plane values. No surface attachment or orientation is required for placement.

# src/geometry/IAutoMovieFootprintInteriorPoint.ts#IAutoMovieFootprintInteriorPoint.IAnchor.x

## @evidence contracts/development/common.md#meaningful-documentation

The X member gives the chosen convex piece's arithmetic mean of world-metre X coordinates.

# src/geometry/IAutoMovieFootprintInteriorPoint.ts#IAutoMovieFootprintInteriorPoint.IAnchor.z

## @evidence contracts/development/common.md#meaningful-documentation

The Z member gives the matching world-metre Z mean for the same piece.
