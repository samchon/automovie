# src/recovery/IAutoMovieRecoverySceneRay.ts#IAutoMovieRecoverySceneRay

## @evidence contracts/development/common.md#meaningful-documentation

The ray associates a source index with the normalized direction used for pairwise parallax.

## @evidence contracts/development/design.md#principled-representation

The evaluator computes the camera center from its inverse pose, then normalizes the vector from that center toward the reconstructed point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ray only represents camera-to-point direction. Pixel measurements remain with their observations, and the resulting pair and angle are carried by point qualification.

# src/recovery/IAutoMovieRecoverySceneRay.ts#IAutoMovieRecoverySceneRay.view

## @evidence contracts/development/common.md#meaningful-documentation

The evaluator copies the actual retained observation's source index for the selected ray.

# src/recovery/IAutoMovieRecoverySceneRay.ts#IAutoMovieRecoverySceneRay.unit

## @evidence contracts/development/common.md#meaningful-documentation

The vector is formed from the world point and the camera center derived from the supplied pose, so both ray operands use the same gauge.
