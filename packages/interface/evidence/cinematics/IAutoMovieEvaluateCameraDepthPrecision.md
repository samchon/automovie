# src/cinematics/IAutoMovieEvaluateCameraDepthPrecision.ts#IAutoMovieEvaluateCameraDepthPrecision.IProps

## @evidence contracts/development/design.md#principled-representation

Metre-valued near/far and required depths, shot-local seconds and a bit-depth constraint define one perspective-buffer precision question; the evaluator reports invalid numeric inputs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

evaluateAutoMovieCameraDepthPrecision consumes only camera identity, time and the existing depth constraint beside four depth scalars.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required depths outside the clip range remain outside-clipping-range; malformed or unrepresentable arithmetic is not reported as sufficient precision.

## @evidence contracts/development/common.md#meaningful-documentation

Documents depth units, positive clip ordering, invalid inputs and the report's pass boundary.
