# src/geometry/sweep/IAutoMovieSpline.ts#IAutoMovieSpline.IFitM

## @evidence contracts/development/common.md#meaningful-documentation

Writable slots 0 through n-1 receive spline second derivatives in ordinate units per squared knot unit. The numeric storage interface does not enforce capacity or finite values; admitted inputs and at least n writable slots remain caller premises.

## @evidence contracts/development/design.md#principled-representation

Writable slots 0 through n-1 receive spline second derivatives in ordinate units per squared knot unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSpline.fit overwrites this caller-owned output for evaluate to reuse; open natural endpoints have zero second derivative.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The numeric storage interface does not enforce capacity or finite values; admitted inputs and at least n writable slots remain caller premises.

# src/geometry/sweep/IAutoMovieSpline.ts#IAutoMovieSpline.IFitScratch

## @evidence contracts/development/common.md#meaningful-documentation

At least 7*n+17 writable scalar slots hold temporary linear-system coefficients and sampled hyperbolic weights with mixed intermediate units. A numeric index signature admits existing arrays and typed buffers without copying; capacity and separation from live inputs/output remain caller premises.

## @evidence contracts/development/design.md#principled-representation

At least 7*n+17 writable scalar slots hold temporary linear-system coefficients and sampled hyperbolic weights with mixed intermediate units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSpline.fit overwrites caller-owned scratch synchronously and retains none of it; final scratch contents are unspecified.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A numeric index signature admits existing arrays and typed buffers without copying; capacity and separation from live inputs/output remain caller premises.
