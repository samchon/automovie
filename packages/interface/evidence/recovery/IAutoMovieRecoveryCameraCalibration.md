# src/recovery/IAutoMovieRecoveryCameraCalibration.ts#IAutoMovieRecoveryCameraCalibration

## @evidence contracts/development/design.md#principled-representation

The upper-triangular K chart retains unequal focal scales, skew and principal offsets; physical calibration and lens correction remain assertions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named chart is shared by resident images, fixed-file manifests and returned source evidence.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It supplies no estimated pose, distortion solver, uncertainty covariance or inferred focal length.

## @evidence contracts/development/common.md#meaningful-documentation

Members state pixel units, matrix convention, positive focal values and nullable supplied uncertainty.
