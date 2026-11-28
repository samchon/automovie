# src/geometry/IAutoMovieParameterizeSweepSection.ts#IAutoMovieParameterizeSweepSection.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Closed curve evaluator and the number of equal parameter spans per turn.

## @evidence contracts/development/design.md#principled-representation

The parameterizer gives four spans to superellipses, one per B-spline control or polygon corner and one per cubic B?zier control triple.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record publishes the metre point callback and span count. The callback retains its authored curve controls.

# src/geometry/IAutoMovieParameterizeSweepSection.ts#IAutoMovieParameterizeSweepSection.IResult.point

## @evidence contracts/development/common.md#meaningful-documentation

Evaluate a finite closed-curve parameter modulo one and return a new XY point in section metres. Keep referenced curve data stable while evaluating.

# src/geometry/IAutoMovieParameterizeSweepSection.ts#IAutoMovieParameterizeSweepSection.IResult.segments

## @evidence contracts/development/common.md#meaningful-documentation

Natural equal span count per turn used to choose walk density during angular inversion.
