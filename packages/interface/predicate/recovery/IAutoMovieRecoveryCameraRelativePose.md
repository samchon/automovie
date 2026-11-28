# src/recovery/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose

## @evidence contracts/development/common.md#meaningful-documentation

The relative pose specifies a first-camera coordinate gauge, world-to-second-camera map, unknown physical scale and an essential-projection diagnostic.

## @evidence contracts/development/design.md#principled-representation

The calibrated essential model yields two proper rotations and two translation signs. Positive-depth support selects the unique winning branch before independent qualification.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose owns accepted transform coefficients and numerical projection discrepancy. Consensus stores rejected or ambiguous candidate evidence outside the accepted transform.

# src/recovery/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose.gauge

## @evidence contracts/development/common.md#meaningful-documentation

The pair triangulator fixes the first camera at identity rotation and zero translation.

# src/recovery/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose.metricScale

## @evidence contracts/development/common.md#meaningful-documentation

The calibrated two-view decomposition determines a direction but uses unit baseline as the length convention.

# src/recovery/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose.rotation

## @evidence contracts/development/common.md#meaningful-documentation

The essential decomposition constructs proper rotations from oriented singular frames.

# src/recovery/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose.translation

## @evidence contracts/development/common.md#meaningful-documentation

The selected third singular-frame column supplies the unit translation and its candidate sign.

# src/recovery/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose.essentialProjectionDiscrepancy

## @evidence contracts/development/common.md#meaningful-documentation

The calibration owner compares normalized source singular values with the mean of the leading two and zero third value, then divides by the source Frobenius magnitude.
