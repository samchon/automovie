# src/core/math/IAutoMovieQuadraticConicProgram.ts#IAutoMovieQuadraticConicProgram

## @evidence contracts/development/design.md#principled-representation

Represents precisely the diagonal PSD, equality and interval problem after signed conic expansion and reversible diagonal equilibration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This private numerical record joins conic assembly, factors, directions and residuals without exposing cone construction to callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every stored coefficient, including zero and tiny nonzero values, remains represented; scaling records invert the coordinate change.

## @evidence contracts/development/common.md#meaningful-documentation

Documents standard form, cone partition, diagonal objective, dual sign mapping and inverse scaling.
