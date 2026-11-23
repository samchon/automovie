# src/recovery/IAutoMovieRecoveryCameraPairInput.ts#IAutoMovieRecoveryCameraPairInput

## @evidence contracts/development/design.md#principled-representation

Supplied upper-triangular pinhole calibration and unchanged pixel-centre charts permit a conditional calibrated two-view problem while leaving camera extrinsics and metric scale unobserved.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Resident pixel acquisition, explicit operating thresholds and finite work limits share one input; observed features and estimated poses are returned separately from saved shape coefficients.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The input contains no truth pose, manual correspondence, mask, subject-specific control point, trained model or reference mesh. Static-scene and lens-correction assumptions remain assertions.

## @evidence contracts/development/common.md#meaningful-documentation

Gives borrowed RGB lifetime, calibration and pixel units, operating thresholds, budget populations and the difference from supplied orthographic cameras.
