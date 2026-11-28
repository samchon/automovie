# src/recovery/IAutoMovieRecoveryMapPose.ts#IAutoMovieRecoveryMapPose

## @evidence contracts/development/common.md#meaningful-documentation

The pose defines the transform direction, matrix layout and signed translation units.

## @evidence contracts/development/design.md#principled-representation

Nine row-major rotation scalars and three camera-frame translation components represent an absolute calibrated pose. The first camera fixes the axes and one seed baseline fixes the shared scale.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pose owns transform coefficients. Camera intrinsics stay in the supplied chart. Point projections and pose qualification belong to their operations.

# src/recovery/IAutoMovieRecoveryMapPose.ts#IAutoMovieRecoveryMapPose.rotation

## @evidence contracts/development/common.md#meaningful-documentation

Projection applies this rotation to a reconstructed point before translation. Rotation increments act on it from the left.

# src/recovery/IAutoMovieRecoveryMapPose.ts#IAutoMovieRecoveryMapPose.translation

## @evidence contracts/development/common.md#meaningful-documentation

The seed and later registered cameras share one scale, so resection translates in the existing coordinate chart.
