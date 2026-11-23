# src/geometry/curve/IAutoMovieCurve64.ts#IAutoMovieCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The retained metadata distinguishes a local parameter interval from a descriptive source interval and does not rescale derivatives.

## @evidence contracts/development/design.md#principled-representation

Optional interval tuples describe provenance; admissible bounds remain the curve producer's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieBernsteinCurvePiece64 uses this helper for the same optional metadata across its three coefficient alternatives; it has no independent runtime lifecycle.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Omission records no source provenance rather than inventing a chart or changing the evaluator clock.

# src/geometry/curve/IAutoMovieCurve64.ts#IAutoMovieCurve64.PieceMetadata

## @evidence contracts/development/design.md#principled-representation

Separate source intervals preserve provenance without changing the normalized evaluator chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both optional fields are shared by every Bernstein branch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An omitted interval does not create an inferred physical phase width.

## @evidence contracts/development/common.md#meaningful-documentation

Explains optional presence and the difference between local domain and source extent.
