# src/construction/IAutoMovieNaturalCubicSpline.ts#IAutoMovieNaturalCubicSpline

## @evidence contracts/development/design.md#principled-representation

Knot values and solved second derivatives represent the natural cubic on strictly increasing abscissae.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three arrays expose the interpolation data without a separate evaluator object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This structural record carries no validation or immutability guarantee; matching finite arrays remain producer premises.

## @evidence contracts/development/common.md#meaningful-documentation

Names the borrowed knots, values and owned curvature array, including their mutation restriction.
