# src/recovery/IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.ts#IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The output distinguishes the essential and pixel matrices, unit-baseline candidate transforms, and the dimensionless projection discrepancy.

## @evidence contracts/development/design.md#principled-representation

Calibration uses the two oriented singular frames, discards the third singular value, and preserves a common leading scale. Two proper rotations and two signs of the unit translation give four branches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation owns calibrated model conversion and candidate generation. The pose selector measures branch support in the supplied views.
