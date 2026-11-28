# src/geometry/IAutoMovieEvaluateCurve64.ts#IAutoMovieEvaluateCurve64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The return describes whole-curve phase units and the exact seam rules, including final endpoint treatment and analytic oval turns.

## @evidence contracts/development/design.md#principled-representation

The reader rejects nonfinite phase before selecting a piece, chooses the next piece at an interior seam and uses final local t=1 at the last endpoint. It scales the derivative by phase width or evaluates oval derivatives per turn. A nonfinite point or derivative is refused.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The output carries the position and analytic derivative from one query. The source primitive remains caller-owned.

# src/geometry/IAutoMovieEvaluateCurve64.ts#IAutoMovieEvaluateCurve64.IResult.point

## @evidence contracts/development/common.md#meaningful-documentation

The point uses the original primitive's millimetre coordinate frame.

# src/geometry/IAutoMovieEvaluateCurve64.ts#IAutoMovieEvaluateCurve64.IResult.tangentPerParameter

## @evidence contracts/development/common.md#meaningful-documentation

The vector uses millimetres per declared phase unit, including the derivative magnitude.
