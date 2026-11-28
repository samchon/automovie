# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy

## @evidence contracts/development/common.md#meaningful-documentation

The policy records explicit admission limits on views, original rows, and coefficient-space size. It distinguishes absolute residual in the original pixel charts from dimensionless direction and QR thresholds.

## @evidence contracts/development/design.md#principled-representation

The explicit family selects squared horizontal directions for ellipse radii and unsquared directions for section centers. A single threshold tests both designs and separates the squared directions before section fitting.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Admission budgets apply to the saved observation and candidate spline size. Extended hidden geometry and edited dimensions belong to the separately produced recipe.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.family

## @evidence contracts/development/common.md#meaningful-documentation

The public fitter checks this literal before constructing the aligned-section systems.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.maxViews

## @evidence contracts/development/common.md#meaningful-documentation

The view-count check runs before the direction and support systems are built.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.maxRows

## @evidence contracts/development/common.md#meaningful-documentation

The support reader counts every view's admitted rows against one cap before it intersects their domains.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.maxSpans

## @evidence contracts/development/common.md#meaningful-documentation

The search starts at one span and stops when either this cap or the available station count bounds the next cubic system.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.maximumResidualPx

## @evidence contracts/development/common.md#meaningful-documentation

Both the fitted section supports and each spline candidate must stay within this same pixel limit.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.minimumDirectionRatio

## @evidence contracts/development/common.md#meaningful-documentation

Recovery uses the threshold both to count separated squared X components and as the inclusive lower bound for the two singular value ratios.

# src/recovery/IAutoMovieRecoveryImageFitPolicy.ts#IAutoMovieRecoveryImageFitPolicy.minimumSplineRatio

## @evidence contracts/development/common.md#meaningful-documentation

The QR threshold governs whether the station design admits an independent longitudinal coefficient solve.
