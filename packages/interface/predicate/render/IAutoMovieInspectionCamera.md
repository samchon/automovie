# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the human-readable view summary and optional exact raster projection.

## @evidence contracts/development/design.md#principled-representation

Position, lens and clip values remain available in legacy records. An applied camera identity additionally seals raster dimensions, the active mask and both transform matrices. Incomplete or invalid state does not establish exact projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The camera owner observes the matrices that draw. Consumers can continue showing the concise summary and use the detailed identity for exact association.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.IProjectionIdentity

## @evidence contracts/development/common.md#meaningful-documentation

States that the identity is made of the actual raster and camera transform, with units.

## @evidence contracts/development/design.md#principled-representation

Pixel dimensions are positive whole values. The camera supplies finite column-major inverse world and applied projection matrices, and its signed layer bit mask. Projection admission requires the matrices to be invertible.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record copies only the camera state needed to distinguish actual geometry projection, including crop and zoom, while leaving subject and renderer authority in their existing receipts.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.IProjectionIdentity.width

## @evidence contracts/development/common.md#meaningful-documentation

Names the actual output pixel width, which changes the evidence key even with the same matrix.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.IProjectionIdentity.height

## @evidence contracts/development/common.md#meaningful-documentation

Names the actual output pixel height, needed to identify projection at a specific raster.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.IProjectionIdentity.worldToView

## @evidence contracts/development/common.md#meaningful-documentation

States sixteen finite column-major values from the camera's inverse world matrix.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.IProjectionIdentity.viewToClip

## @evidence contracts/development/common.md#meaningful-documentation

States sixteen finite column-major values from the applied projection, including crop and zoom.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.IProjectionIdentity.layers

## @evidence contracts/development/common.md#meaningful-documentation

States the signed 32-bit camera mask used to choose visible scene layers.

# src/render/IAutoMovieInspectionCamera.ts#IAutoMovieInspectionCamera.projectionIdentity

## @evidence contracts/development/common.md#meaningful-documentation

The field is optional when old records or invalid native camera data supply only the concise camera summary.
