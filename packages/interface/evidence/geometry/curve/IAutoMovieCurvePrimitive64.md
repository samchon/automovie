# src/geometry/curve/IAutoMovieCurvePrimitive64.ts#IAutoMovieCurvePrimitive64

## @evidence contracts/development/design.md#principled-representation

The type tag selects cubic, analytic ellipse or general Bernstein semantics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One union is the shared input of primitive admission and evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unknown representation is accepted through a generic coefficient fallback.

## @evidence contracts/development/common.md#meaningful-documentation

Names exactly which representations the public evaluator consumes.
