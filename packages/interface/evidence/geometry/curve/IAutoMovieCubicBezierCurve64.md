# src/geometry/curve/IAutoMovieCubicBezierCurve64.ts#IAutoMovieCubicBezierCurve64

## @evidence contracts/development/design.md#principled-representation

Spans and phase widths retain the original generating coefficients and derivative scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Position, topology and phase partition travel together so an evaluator need not infer a chart.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sampled display network or implicit equal-width partition substitutes for the supplied spans.

## @evidence contracts/development/common.md#meaningful-documentation

Properties distinguish millimetre positions, phase units and closure claims.
