# src/core/IAutoMovieDrivenCurve.ts#IAutoMovieDrivenCurve

## @evidence contracts/development/design.md#principled-representation `evaluateDrivenCurve` validates the points, returns the first output at or below the first source, scans for the first point whose source reaches the query and lerps from its predecessor, and returns the last output past the end, a piecewise-linear map with constant extension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The curve is one ordered point list wrapped in an object, so a driven driver chooses between the linear remap and the curve by the presence of one field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unsorted, duplicate or non-finite points throw rather than being sorted or dropped, and an unsampled source reads the curve's own first point instead of borrowing the linear driver's `inRange`.

## @evidence contracts/development/common.md#meaningful-documentation

States the interpolation, the behaviour outside the authored range, every validation the evaluator throws on, and the answer for an unsampled source.
