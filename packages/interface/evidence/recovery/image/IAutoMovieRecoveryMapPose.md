# src/recovery/image/IAutoMovieRecoveryMapPose.ts#IAutoMovieRecoveryMapPose

## @evidence contracts/development/design.md#principled-representation

Proper R and t represent Xcamera=R*Xworld+t in the first-camera coordinate system; only the seed baseline is unit length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named numerical record serves resection, joint fitting and sparse-map publication.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No metric scale, expected pose or covariance is supplied by this record.

## @evidence contracts/development/common.md#meaningful-documentation

Members specify row order, axes, transform direction and translation units.
