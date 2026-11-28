# src/recovery/IAutoMovieRecoveryMapProjection.ts#IAutoMovieRecoveryMapProjection

## @evidence contracts/development/common.md#meaningful-documentation

The record names projected pixel coordinates, positive camera depth, and the units and column order of the two derivative matrices.

## @evidence contracts/development/design.md#principled-representation

The projector transforms the point to camera coordinates, evaluates the pinhole quotient and applies its analytic gradient to pose and world-point increments.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Projection returns fresh pixel and derivative arrays. The optimizer separately compares them with admitted observations and determines map acceptance.

# src/recovery/IAutoMovieRecoveryMapProjection.ts#IAutoMovieRecoveryMapProjection.pixel

## @evidence contracts/development/common.md#meaningful-documentation

Pinhole chart evaluation divides by camera depth and applies supplied focal terms, skew, and principal-point offsets.

# src/recovery/IAutoMovieRecoveryMapProjection.ts#IAutoMovieRecoveryMapProjection.depth

## @evidence contracts/development/common.md#meaningful-documentation

The returned scalar is the camera point's positive Z, before any homogeneous division.

# src/recovery/IAutoMovieRecoveryMapProjection.ts#IAutoMovieRecoveryMapProjection.cameraJacobian

## @evidence contracts/development/common.md#meaningful-documentation

The first columns multiply the image gradient by the negative skew of the rotated point; the last columns use the gradient directly for independent translation.

# src/recovery/IAutoMovieRecoveryMapProjection.ts#IAutoMovieRecoveryMapProjection.pointJacobian

## @evidence contracts/development/common.md#meaningful-documentation

The projector multiplies the camera-coordinate image gradient by the rotation to express derivatives in world coordinates.
