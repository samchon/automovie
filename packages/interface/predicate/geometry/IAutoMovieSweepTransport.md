# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport

## @evidence contracts/development/common.md#meaningful-documentation

Reusable spine transport with writable control arrays and packed point, tangent and frame queries.

## @evidence contracts/development/design.md#principled-representation

Update recomputes the centripetal cubic path on chord-length shares and optionally fills a double-reflection frame table.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The transport keeps compiled path buffers internal. Its caller controls authored arrays, rebuild timing and query destinations.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.count

## @evidence contracts/development/common.md#meaningful-documentation

Number of control points fixed when storage is created.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.points

## @evidence contracts/development/common.md#meaningful-documentation

Writable packed metre XYZ controls, three per point in spine order.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.normal

## @evidence contracts/development/common.md#meaningful-documentation

Writable XYZ direction used to seed the first section axis after projection perpendicular to the starting tangent.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.start

## @evidence contracts/development/common.md#meaningful-documentation

Writable XYZ departure direction. An all-zero sentinel uses the spline's first derivative direction.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.end

## @evidence contracts/development/common.md#meaningful-documentation

Writable XYZ arrival direction. An all-zero sentinel uses the spline's last derivative direction.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.update

## @evidence contracts/development/common.md#meaningful-documentation

Recompile the path and optional frame table from the current control buffers.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.length

## @evidence contracts/development/common.md#meaningful-documentation

Return the current control-polygon length in metres, used to scale the normalized chord coordinate.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.point

## @evidence contracts/development/common.md#meaningful-documentation

Write three model-metre scalars of the compiled spine point at the clamped chord parameter.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.tangent

## @evidence contracts/development/common.md#meaningful-documentation

Write the unit tangent in increasing chord-parameter direction. A vanishing derivative throws.

# src/geometry/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport.frame

## @evidence contracts/development/common.md#meaningful-documentation

Write twelve scalars as origin, first axis, second axis and normal. Frame queries require transport compiled with frames.
