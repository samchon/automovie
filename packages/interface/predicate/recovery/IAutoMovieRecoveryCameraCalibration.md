# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies the calibration and corrections as supplied and gives the units and conventions of every intrinsic term.

## @evidence contracts/development/design.md#principled-representation

Focal lengths, skew and principal point define an upper-triangular pinhole matrix. Chart admission verifies its inverse and pixel increment round trips.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller owns the calibration and correction assertions. Recovery uses them to normalize observations and estimates relative extrinsics.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.type

## @evidence contracts/development/common.md#meaningful-documentation

Resident view validation accepts the pinhole tag before constructing row-major intrinsic matrices.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.calibration

## @evidence contracts/development/common.md#meaningful-documentation

The supplied-calibration tag remains with the evidence; pose fitting uses the resulting fixed chart.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.distortion

## @evidence contracts/development/common.md#meaningful-documentation

Resident admission checks the caller-corrected assertion. File decoding preserves the encoded chart coordinates.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.focalPx

## @evidence contracts/development/common.md#meaningful-documentation

Chart construction puts fx and fy on the first two diagonal entries and checks that their inverse preserves axis steps.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.skewPx

## @evidence contracts/development/common.md#meaningful-documentation

The forward K couples normalized Y into pixel X using this coefficient. The analytic inverse removes that coupling.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.principalPointPx

## @evidence contracts/development/common.md#meaningful-documentation

The principal point supplies chart translation. The chart owner checks round trips at individual axes and image bounds.

# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration.uncertaintyPx

## @evidence contracts/development/common.md#meaningful-documentation

View admission checks this optional assertion and evidence copies it. Observation and pose fitting use supplied chart coefficients.
