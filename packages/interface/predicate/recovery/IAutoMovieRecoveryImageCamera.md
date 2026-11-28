# src/recovery/IAutoMovieRecoveryImageCamera.ts#IAutoMovieRecoveryImageCamera

## @evidence contracts/development/common.md#meaningful-documentation

The camera states the supplied calibration model, radians, square-pixel pitch in millimetres and the principal point in pixel-edge coordinates. The observation chart test checks those units through known row and cell addresses.

## @evidence contracts/development/design.md#principled-representation

Recovery samples row centers at (v0 − row − 0.5) × pitch and interval edges at (column − u0) × pitch. Measured support preparation uses cos and sin of the azimuth to map the recorded U directions into the common frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record contains the supplied projection settings for the current image coordinates. It keeps physical calibration separate from silhouette rows and geometry later inferred from those rows.

# src/recovery/IAutoMovieRecoveryImageCamera.ts#IAutoMovieRecoveryImageCamera.type

## @evidence contracts/development/common.md#meaningful-documentation

Chart admission requires the horizontal-orthographic tag before using physical pixel coordinates.

# src/recovery/IAutoMovieRecoveryImageCamera.ts#IAutoMovieRecoveryImageCamera.calibration

## @evidence contracts/development/common.md#meaningful-documentation

The chart admits the supplied tag. Camera estimation is a separate operation.

# src/recovery/IAutoMovieRecoveryImageCamera.ts#IAutoMovieRecoveryImageCamera.azimuthRadians

## @evidence contracts/development/common.md#meaningful-documentation

Support preparation uses its cosine and sine as the direction components in the common XZ plane.

# src/recovery/IAutoMovieRecoveryImageCamera.ts#IAutoMovieRecoveryImageCamera.pixelPitchMm

## @evidence contracts/development/common.md#meaningful-documentation

Multiplying by this pitch takes observed pixel rows and cell boundaries to millimetres. Chart admission checks that pixel increments remain representable.

# src/recovery/IAutoMovieRecoveryImageCamera.ts#IAutoMovieRecoveryImageCamera.principalPointPx

## @evidence contracts/development/common.md#meaningful-documentation

The row assertion subtracts the half-row center when mapping Y back to the original row. Support edges use whole-pixel addresses relative to u0.
