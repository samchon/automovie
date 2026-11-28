# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

Sampled error tolerance, candidate degree and bounded subdivision work for planar curve reduction.

## @evidence contracts/development/design.md#principled-representation

The fitter checks a supported degree and valid numeric budgets before observing the source, then uses an independent held-out criterion to accept candidate pieces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The options state fitting policy separately from source charts and output receipts.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions.toleranceMm

## @evidence contracts/development/common.md#meaningful-documentation

Positive finite threshold in millimetres for admitted held-out source-to-fit correspondence.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions.degree

## @evidence contracts/development/common.md#meaningful-documentation

Fix polynomial degree at three, four or five, or compare those choices with bitangent conics using mixed.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions.maximumPieces

## @evidence contracts/development/common.md#meaningful-documentation

Positive safe-integer budget for accepted pieces and unresolved leaves.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions.maximumDepth

## @evidence contracts/development/common.md#meaningful-documentation

Positive safe-integer limit through 52 on binary subdivision depth in an initial smooth chart.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IOptions.maximumQueries

## @evidence contracts/development/common.md#meaningful-documentation

Positive safe-integer budget for source position and derivative invocations, including nested conic fitting.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Sample-qualified reduction receipt with coverage status, accepted pieces and measured work and error.

## @evidence contracts/development/design.md#principled-representation

The fitter reports complete when coverage reaches every requested chart under its sampled criterion, partial for retained pieces with omissions, and refused when no pieces survive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result transfers coefficients and factual diagnostics. It keeps sampled error and work visible without retaining the original source geometry.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.status

## @evidence contracts/development/common.md#meaningful-documentation

Sampled coverage state. Complete covers the requested chart domain, partial retains some covering pieces, and refused transfers no pieces.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.pieces

## @evidence contracts/development/common.md#meaningful-documentation

Admitted registered pieces in increasing source order. Omitted intervals have no fabricated replacement.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.maximumSampleErrorMm

## @evidence contracts/development/common.md#meaningful-documentation

Largest measured sample discrepancy over retained pieces in millimetres. An empty result reports zero.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.storedScalars

## @evidence contracts/development/common.md#meaningful-documentation

Scalar storage measure with two coordinates per control and three metadata scalars per piece. Exactly shared adjacent endpoints count once.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.queries

## @evidence contracts/development/common.md#meaningful-documentation

Actual number of position and derivative callback invocations. Cached position reads avoid a repeat charge.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

Ordered messages describing sampled scope, input refusals and reasons for unprocessed geometry.

# src/geometry/IAutoMovieCompactCurveApproximation.ts#IAutoMovieCompactCurveApproximation.IResult.certified

## @evidence contracts/development/common.md#meaningful-documentation

Fixed false marker for the sampled qualification. Continuous error needs its own certificate.
