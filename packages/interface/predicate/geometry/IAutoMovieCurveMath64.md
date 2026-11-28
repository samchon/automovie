# src/geometry/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.Span

## @evidence contracts/development/common.md#meaningful-documentation

Mutable ordered four-control XYZ Bernstein span in one caller-defined chart and value unit.

## @evidence contracts/development/design.md#principled-representation

The cubic evaluator uses the first and last coefficients as endpoints and the interior controls for shaping. Subdivision returns the same storage layout.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tuple fixes cubic degree and keeps chart width separate. The caller supplies valid finite coordinates and parameter scaling.

# src/geometry/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.IToHermiteResult

## @evidence contracts/development/common.md#meaningful-documentation

Owned cubic endpoints and endpoint derivatives per supplied positive finite chart width.

## @evidence contracts/development/design.md#principled-representation

The inverse reads the endpoint controls and forms three times the adjacent control difference divided by the original chart width. It tries equivalent evaluation orders for finite binary64 resolution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result transfers four independent triples. The receiving chart supplies length and units for any later reconstruction.

# src/geometry/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.IToHermiteResult.start

## @evidence contracts/development/common.md#meaningful-documentation

Fresh first Bernstein endpoint triple in the input chart and coefficient units.

# src/geometry/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.IToHermiteResult.end

## @evidence contracts/development/common.md#meaningful-documentation

Fresh last Bernstein endpoint triple in the same chart and coefficient units.

# src/geometry/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.IToHermiteResult.startDerivative

## @evidence contracts/development/common.md#meaningful-documentation

Fresh derivative per chart unit at the first endpoint, algebraically 3 ? (P1 ? P0) divided by chart width.

# src/geometry/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.IToHermiteResult.endDerivative

## @evidence contracts/development/common.md#meaningful-documentation

Fresh derivative per chart unit at the last endpoint, algebraically 3 ? (P3 ? P2) divided by chart width.
