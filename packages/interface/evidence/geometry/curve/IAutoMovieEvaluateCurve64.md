# src/geometry/curve/IAutoMovieEvaluateCurve64.ts#IAutoMovieEvaluateCurve64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

A primitive evaluation returns millimetre position and millimetres per declared phase-unit tangent. The tangent is not normalized; closure and regularity are independent of having a finite returned jet.

## @evidence contracts/development/design.md#principled-representation

A primitive evaluation returns millimetre position and millimetres per declared phase-unit tangent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

evaluateAutoMovieCurve64 owns piece selection and derivative scaling for curve consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The tangent is not normalized; closure and regularity are independent of having a finite returned jet.
