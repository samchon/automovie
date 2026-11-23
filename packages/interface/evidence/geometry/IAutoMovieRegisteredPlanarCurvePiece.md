# src/geometry/IAutoMovieRegisteredPlanarCurvePiece.ts#IAutoMovieRegisteredPlanarCurvePiece

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes source registration from rational speed and identifies sampled error and millimetre controls.

## @evidence contracts/development/design.md#principled-representation

The closed union requires exactly the fields for polynomial or normalized rational evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Polynomial pieces retain their degree-specific fields while the conic arm reuses the actual record forwarded from conic fitting; the union serves coefficient evaluation and storage comparison.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No source evaluator or dense sample table is retained in output.
