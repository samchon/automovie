# src/geometry/IAutoMoviePolylineFit.ts#IAutoMoviePolylineFit

## @evidence contracts/development/design.md#principled-representation

The record preserves the complete cubic and the fitter's independent residual and polyline estimates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One public result owns coefficients and scalar fitting diagnostics without importing a private implementation namespace.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Polyline estimates do not certify error against an unknown continuous source surface.

## @evidence contracts/development/common.md#meaningful-documentation

Members document physical units, ownership and optional-state meaning.
