# src/recovery/IAutoMovieRecoveryPoseResidualsLinearizeOperation.ts#IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The operation gives original pixel residual units and the correspondence and tangent order of the derivative rows.

## @evidence contracts/development/design.md#principled-representation

The local Jacobian composes derivatives of the epipolar matrix with the quotient rule. Columns follow three left-rotation coordinates and the two translation-direction tangent coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model owns the calibrated matrices and tangent basis. The operation returns the fixed-population residual linearization for robust pose refinement.
