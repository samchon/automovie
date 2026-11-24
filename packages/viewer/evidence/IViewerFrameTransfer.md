# src/IViewerFrameTransfer.ts#IViewerFrameTransfer

## @evidence contracts/development/design.md#principled-representation

The record holds exactly what the frame controller captures and restores: the native camera snapshot and the completed scene seconds. The compiler owns its shape, so restore reads these declared fields without a runtime type check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One named transfer record replaces the controller's untyped state, reusing IViewerCameraStateSnapshot for the camera; it adds no field the controller does not already transfer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unknown or opaque state is admitted; the camera keeps its own snapshot type rather than a copied shape.

## @evidence contracts/development/common.md#meaningful-documentation

Fields state the camera payload and the seconds unit with its finite nonnegative domain.