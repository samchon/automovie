# src/geometry/curve/IAutoMovieMeasureContourFace64.ts#IAutoMovieMeasureContourFace64.IResult

## @evidence contracts/development/design.md#principled-representation

Two squared-length measurements distinguish source millimetres from rendered metres without implying equality after floating-point conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

measureAutoMovieContourFace64 supplies both predicates read by generateAutoMovieContourLoft64 before staging a face.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No epsilon or repaired geometry replaces zero or nonfinite arithmetic; the emission caller decides omission.

## @evidence contracts/development/common.md#meaningful-documentation

Explicitly identifies double area, independent arithmetic paths and the caller's finite-positive check.
