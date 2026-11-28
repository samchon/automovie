# src/geometry/IAutoMovieRationalBernsteinVector64.ts#IAutoMovieRationalBernsteinVector64

## @evidence contracts/development/common.md#meaningful-documentation

Three-component rational Bernstein field with one scalar homogeneous denominator.

## @evidence contracts/development/design.md#principled-representation

The evaluator shares the denominator across the three numerator components. Subdivision partitions both coefficient fields over the same interval fractions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The field stores numerator and denominator without baking samples. The consuming geometry chooses frame, units and query coordinate.

# src/geometry/IAutoMovieRationalBernsteinVector64.ts#IAutoMovieRationalBernsteinVector64.numerator

## @evidence contracts/development/common.md#meaningful-documentation

Mutable homogeneous XYZ Bernstein controls in one caller-defined frame, ordered along the field parameter.

# src/geometry/IAutoMovieRationalBernsteinVector64.ts#IAutoMovieRationalBernsteinVector64.denominator

## @evidence contracts/development/common.md#meaningful-documentation

Mutable scalar Bernstein coefficients on the same local parameter. Supply a positive finite evaluated denominator.
