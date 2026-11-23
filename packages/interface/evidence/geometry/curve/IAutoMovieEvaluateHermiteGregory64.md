# src/geometry/curve/IAutoMovieEvaluateHermiteGregory64.ts#IAutoMovieEvaluateHermiteGregory64.IResult

## @evidence contracts/development/design.md#principled-representation

Position retains boundary units and frame; du and dv differentiate dimensionless chart coordinates without normalization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

evaluateAutoMovieHermiteGregory64 publishes the three vectors needed to sample the chart and form its analytic normal.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record preserves rational-chart derivatives and makes no bicubic-equivalence or regularity claim.

## @evidence contracts/development/common.md#meaningful-documentation

Defines derivative direction, caller compatibility, allocation, validation and exception behavior.
