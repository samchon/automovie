# src/recovery/computation/IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.ts#IAutoMovieRecoveryEpipolarMatrixCalibrateOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 calibrated essential matrix; translation is recoverable only up to the admitted gauge. Row-major 3 by 3 fundamental matrix in the declared pixel charts; homogeneous scale has no metric meaning.

## @evidence contracts/development/design.md#principled-representation

Row-major 3 by 3 fundamental matrix in the declared pixel charts; homogeneous scale has no metric meaning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

calibrateRecoveryEpipolarMatrix, selectRecoveryCameraPose share IAutoMovieRecoveryEpipolarMatrixCalibrateOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
