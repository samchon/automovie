# src/recovery/computation/IAutoMovieRecoveryImageFeaturesExtractionOperation.ts#IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Selected image features with owned descriptors, in deterministic response order. Image observation [x,y] in the original pixel-centre chart.

## @evidence contracts/development/design.md#principled-representation

Image observation [x,y] in the original pixel-centre chart.

## @evidence contracts/development/design.md#minimal-and-owned-surface

extractRecoveryImageFeatures, observeRecoveryCameraSet, estimateAutoMovieRecoveryCameraPair share IAutoMovieRecoveryImageFeaturesExtractionOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Owned normalized descriptor components; matching reads them without modifying the feature.
