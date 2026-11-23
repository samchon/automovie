# src/geometry/curve/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.Span

## @evidence contracts/development/design.md#principled-representation

Four ordered vectors enforce a cubic Bernstein coefficient net; frame, coefficient units and finite-value admission belong to the consuming operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One tuple records endpoint and handle order for all cubic helpers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Handles remain coefficients rather than interpolation samples.

## @evidence contracts/development/common.md#meaningful-documentation

P0/P1/P2/P3 order is stated independently of the enclosing coordinate units.

# src/geometry/curve/IAutoMovieCurveMath64.ts#IAutoMovieCurveMath64.IToHermiteResult

## @evidence contracts/development/design.md#principled-representation

Endpoint positions retain the input frame and length unit; derivatives divide that unit by the supplied chart-width unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieCurveMath64.toHermite returns exactly the endpoint data consumed by Hermite reconstruction and recovery curve conversion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Derivatives retain magnitude and zero values instead of becoming unit tangents; the converter rejects unresolved arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint ownership, derivative scaling, admission and finite-round-trip limits.
