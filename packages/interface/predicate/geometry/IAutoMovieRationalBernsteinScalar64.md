# src/geometry/IAutoMovieRationalBernsteinScalar64.ts#IAutoMovieRationalBernsteinScalar64

## @evidence contracts/development/common.md#meaningful-documentation

Scalar quotient represented by homogeneous Bernstein numerator and denominator coefficients on one parameter chart.

## @evidence contracts/development/design.md#principled-representation

The quotient evaluator evaluates each coefficient run at the same parameter and applies the quotient rule when requested. It rejects a nonpositive evaluated denominator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record stores the two existing coefficient runs. The caller supplies query phase and the scalar field's physical unit.

# src/geometry/IAutoMovieRationalBernsteinScalar64.ts#IAutoMovieRationalBernsteinScalar64.numerator

## @evidence contracts/development/common.md#meaningful-documentation

Mutable scalar numerator coefficients in Bernstein order. Keep the evaluated division and any needed derivative products representable.

# src/geometry/IAutoMovieRationalBernsteinScalar64.ts#IAutoMovieRationalBernsteinScalar64.denominator

## @evidence contracts/development/common.md#meaningful-documentation

Mutable scalar denominator coefficients on the numerator's parameter chart. Supply a positive finite evaluated denominator.
