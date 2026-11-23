# src/geometry/curve/IAutoMovieBernsteinCurve64.ts#IAutoMovieBernsteinCurve64

## @evidence contracts/development/design.md#principled-representation

Each piece keeps its own polynomial or homogeneous coefficient field and local parameterization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The enclosing partition supplies derivative scaling while pieces supply their actual degree.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No cubic conversion, degree reduction or sampled curve is implied.

## @evidence contracts/development/common.md#meaningful-documentation

Separates local piece derivatives from enclosing phase-unit derivatives.
