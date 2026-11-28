# src/geometry/IAutoMovieStationHermiteLoop.ts#IAutoMovieStationHermiteLoop.loop

## @evidence contracts/development/common.md#meaningful-documentation

The property locates the curve in the station-local [a,b] frame and names its chord-length period.

# src/geometry/IAutoMovieStationHermiteLoop.ts#IAutoMovieStationHermiteLoop.IPeriodicLoop

## @evidence contracts/development/common.md#meaningful-documentation

The record gives the minimum knot count, coordinate units, copying and orientation change, and the positive finite period supplied by the caller.

## @evidence contracts/development/design.md#principled-representation

In profile preparation, the Engine copies the original knots, normalizes winding, and clocks the periodic curve at its positive-a crossing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The loop needs reduced periodic knots and their chord-length scale. Station placement belongs to the containing input.

# src/geometry/IAutoMovieStationHermiteLoop.ts#IAutoMovieStationHermiteLoop.IPeriodicLoop.knots

## @evidence contracts/development/common.md#meaningful-documentation

The knot list gives millimetre coordinates, the minimum count, and the prepared winding and copying behavior.

# src/geometry/IAutoMovieStationHermiteLoop.ts#IAutoMovieStationHermiteLoop.IPeriodicLoop.length

## @evidence contracts/development/common.md#meaningful-documentation

The period is the positive finite planar chord length in millimetres, reused as a profile scale.
