# src/recovery/IAutoMovieRecoveryImageBackground.ts#IAutoMovieRecoveryImageBackground

## @evidence contracts/development/common.md#meaningful-documentation

The two fields identify one RGB reference and an inclusive channel-distance threshold. The existing small-raster fixture independently checks the same decision for all three channels.

## @evidence contracts/development/design.md#principled-representation

Recovery builds one 256-entry table per channel using absolute byte difference. Its mask classifies the union of those channels, which is equivalent to comparing their maximum difference against the threshold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies this one rule for all views. The observer uses it to measure pixel support without carrying lookup tables or settings for other segmentation algorithms into the record.

# src/recovery/IAutoMovieRecoveryImageBackground.ts#IAutoMovieRecoveryImageBackground.rgb

## @evidence contracts/development/common.md#meaningful-documentation

Recovery uses the three stated references independently as lookup-table origins.

# src/recovery/IAutoMovieRecoveryImageBackground.ts#IAutoMovieRecoveryImageBackground.threshold

## @evidence contracts/development/common.md#meaningful-documentation

The fixture at adjacent thresholds 210 and 211 distinguishes equality from a value below threshold.
