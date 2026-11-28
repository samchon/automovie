# src/geometry/IAutoMovieCurveLengthMeasurement64.ts#IAutoMovieCurveLengthMeasurement64

## @evidence contracts/development/common.md#meaningful-documentation

The observation documents its fine and coarse quadrature populations, shared millimetre units and the inability to turn their difference into a guaranteed error bound.

## @evidence contracts/development/design.md#principled-representation

Length readers integrate original physical speed and report the fine integral and absolute difference. The strict arbitrary-piece reader admits a whole panel count and finite increasing domains, checks exact XYZ derivatives at both endpoints and the interior nodes, and refuses nonfinite sums or unresolved arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The return carries two scalar observations and does not retain the source derivative, sampled nodes or callback state.

# src/geometry/IAutoMovieCurveLengthMeasurement64.ts#IAutoMovieCurveLengthMeasurement64.lengthMm

## @evidence contracts/development/common.md#meaningful-documentation

The reported scalar is the doubled-panel integral of physical speed in millimetres.

# src/geometry/IAutoMovieCurveLengthMeasurement64.ts#IAutoMovieCurveLengthMeasurement64.differenceMm

## @evidence contracts/development/common.md#meaningful-documentation

The scalar gives the absolute difference between the coarse and fine populations. Shared missed features or cancellation can make it small.
