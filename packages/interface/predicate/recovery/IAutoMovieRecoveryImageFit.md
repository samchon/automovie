# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit

## @evidence contracts/development/common.md#meaningful-documentation

The fit records residuals and rank diagnostics for the accepted aligned-ellipse profiles, acquisition identity, and the finite common interval that supported the solve.

## @evidence contracts/development/design.md#principled-representation

Each candidate evaluates both silhouette edges in every view at the common stations and divides each physical displacement by that view's pixel pitch. The fit keeps section-family and longitudinal residuals independently.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result keeps source identity and measurements with the acquisition cohort. The enclosed recipe contains the coefficients and coverage used by source-free compilation.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.recipe

## @evidence contracts/development/common.md#meaningful-documentation

The generated recipe includes its family, physical frame, edit factors, and coverage literals together.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.cohort

## @evidence contracts/development/common.md#meaningful-documentation

The fitter transfers the admitted observation cohort even when it reports only partial physical coverage.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.sources

## @evidence contracts/development/common.md#meaningful-documentation

The producer maps the supplied views to capture identity pairs and preserves their order.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.maximumResidualPx

## @evidence contracts/development/common.md#meaningful-documentation

For the accepted candidate, both edge errors from each view are divided by that view's physical pixel pitch.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.familyResidualPx

## @evidence contracts/development/common.md#meaningful-documentation

The section-equation solution is evaluated against the edges before any shared Y profiles are solved.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.directionRank

## @evidence contracts/development/common.md#meaningful-documentation

The two-column direction solver derives one singular-value ratio for each of the center and radius systems.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.splineRankRatio

## @evidence contracts/development/common.md#meaningful-documentation

The profile solver reports a ratio of QR diagonal magnitudes, independent of the two camera-design ratios.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.counts

## @evidence contracts/development/common.md#meaningful-documentation

The producer uses four scalar fields, each with three more free coefficients than the span count.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.observedIntervalMm

## @evidence contracts/development/common.md#meaningful-documentation

The endpoints use the latest first row and the earliest last row across the views.

# src/recovery/IAutoMovieRecoveryImageFit.ts#IAutoMovieRecoveryImageFit.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The result records the common-domain and interpolation limitations alongside the scalar measurements.
