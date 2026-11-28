# src/recovery/IAutoMovieRecoveryImageFitCounts.ts#IAutoMovieRecoveryImageFitCounts

## @evidence contracts/development/common.md#meaningful-documentation

The shared record distinguishes the number of distinct common stations, longitudinal spans, and independent scalar coefficients before Bernstein conversion.

## @evidence contracts/development/design.md#principled-representation

With N spans, each scalar field has N + 3 free coefficients. The ellipse uses four fields, while the convex-support fit uses two fields per view.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Counts follow the fitted coefficient space. The separate convex-support generation record reports boundary events, intervals, and vertices.

# src/recovery/IAutoMovieRecoveryImageFitCounts.ts#IAutoMovieRecoveryImageFitCounts.rows

## @evidence contracts/development/common.md#meaningful-documentation

The common station set can include a row originally recorded by only one view. The other views contribute interpolated support there.

# src/recovery/IAutoMovieRecoveryImageFitCounts.ts#IAutoMovieRecoveryImageFitCounts.spans

## @evidence contracts/development/common.md#meaningful-documentation

The returned count follows the accepted candidate, which can use fewer spans than the policy allowed.

# src/recovery/IAutoMovieRecoveryImageFitCounts.ts#IAutoMovieRecoveryImageFitCounts.freeScalars

## @evidence contracts/development/common.md#meaningful-documentation

The producers count the independent spline basis coefficients, before each span is expressed with four Bernstein controls.
