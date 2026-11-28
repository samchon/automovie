# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation

## @evidence contracts/development/common.md#meaningful-documentation

The report accounts for detected maxima, candidate admission, selected descriptor attempts and the two reasons selected points may lack a retained descriptor.

## @evidence contracts/development/design.md#principled-representation

The extractor counts interior Harris maxima across levels, filters shifted and oriented support, applies spatial suppression, then builds normalized gradient descriptors. All coordinate levels return to the source chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Per-image detection owns these counts. The pair evidence keeps the source ID and observed totals. Match indices address the resulting retained feature array.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.viewId

## @evidence contracts/development/common.md#meaningful-documentation

The pair assembler associates each extracted population with its source-order view record.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.rawCorners

## @evidence contracts/development/common.md#meaningful-documentation

The extractor counts a maximum after the response threshold and local comparison but before the subpixel solve.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.validCandidates

## @evidence contracts/development/common.md#meaningful-documentation

A localized and oriented candidate advances this count only if its rotated descriptor window fits the image level.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.selectedBeforeDescriptor

## @evidence contracts/development/common.md#meaningful-documentation

The suppression owner slices its sorted candidate list to the requested retained-feature cap.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.observedDescriptors

## @evidence contracts/development/common.md#meaningful-documentation

The pair records the final feature array length after clipping and normalization.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.zeroDescriptors

## @evidence contracts/development/common.md#meaningful-documentation

The extractor increments this counter when the descriptor norm is at or below its binary64 floor.

# src/recovery/IAutoMovieRecoveryCameraFeaturePopulation.ts#IAutoMovieRecoveryCameraFeaturePopulation.invalidSupportDescriptors

## @evidence contracts/development/common.md#meaningful-documentation

The descriptor loop rechecks actual sample coordinates before interpolation, retaining a distinct count when the support check fails.
