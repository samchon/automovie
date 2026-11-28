# src/recovery/IAutoMovieRecoveryImageFeaturesExtractionOperation.ts#IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation specifies resident image inputs, per-image policy and caps, original pixel-center outputs, and extraction-stage counts.

## @evidence contracts/development/design.md#principled-representation

Detection maps level coordinates back to the original chart. Descriptors use a 128-component oriented spatial histogram with normalization, clipping and renormalization.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The extractor owns observed descriptors and counts. The caller retains image bytes, and later matching owns proposed feature correspondence.
