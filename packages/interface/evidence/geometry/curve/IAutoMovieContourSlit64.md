# src/geometry/curve/IAutoMovieContourSlit64.ts#IAutoMovieContourSlit64

## @evidence contracts/development/design.md#principled-representation

Projection retains input Cartesian units and a dimensionless clamped segment fraction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IClosestResult carries the point, fraction and distance read by slit joins and correspondence scoring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coincident endpoints remain degenerate segments without invented direction.

## @evidence contracts/development/common.md#meaningful-documentation

The result documents fresh point ownership and finite-arithmetic premises.

# src/geometry/curve/IAutoMovieContourSlit64.ts#IAutoMovieContourSlit64.IClosestResult

## @evidence contracts/development/design.md#principled-representation

A projected point, dimensionless clamped segment fraction and distance preserve the supplied Cartesian frame and length unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieContourSlit64.closest supplies the same projection to slit joins and contour separation scoring.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A degenerate segment uses its endpoint, with no invented direction or infinite-line extrapolation.

## @evidence contracts/development/common.md#meaningful-documentation

States projection ownership, units, fraction range and finite-arithmetic premise.
