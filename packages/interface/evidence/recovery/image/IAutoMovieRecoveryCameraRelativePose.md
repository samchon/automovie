# src/recovery/image/IAutoMovieRecoveryCameraRelativePose.ts#IAutoMovieRecoveryCameraRelativePose

## @evidence contracts/development/design.md#principled-representation

Row-major R and unit t map X2=R*X1+t; physical length scale and camera covariance remain unknown.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.

## @evidence contracts/development/common.md#meaningful-documentation

Members state axis convention, mapping direction, unknown scale and the numerical meaning of essential projection discrepancy.
