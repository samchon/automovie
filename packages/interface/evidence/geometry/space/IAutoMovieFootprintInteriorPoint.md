# src/geometry/space/IAutoMovieFootprintInteriorPoint.ts#IAutoMovieFootprintInteriorPoint.IResult

## @evidence contracts/development/design.md#principled-representation

x and z are world-plan metres inherited from the footprint; no height or orientation is inferred.

## @evidence contracts/development/design.md#minimal-and-owned-surface

footprintInteriorPoint supplies the surface case of propAnchorFrame, which evaluates height separately.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The footprint decomposition owns ring hygiene; null means no positive-area piece survived, including rejected or degenerate footprints. Equal-area ties keep the first piece.

## @evidence contracts/development/common.md#meaningful-documentation

An interior plan anchor selected from the largest-area convex footprint piece. x and z are world-plan metres inherited from the footprint; no height or orientation is inferred.
