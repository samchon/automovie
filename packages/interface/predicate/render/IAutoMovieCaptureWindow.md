# src/render/IAutoMovieCaptureWindow.ts#IAutoMovieCaptureWindow

## @evidence contracts/development/common.md#meaningful-documentation

States the native nearest, first and last indices and the event's exact time.

## @evidence contracts/development/design.md#principled-representation

The instant retains its authored or detected seconds even when the nearest native frame is clamped at a terminal boundary. First and last remain inclusive native addresses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The window holds inclusive native indices and exact event seconds so a client can recover both an authored pose and its nearest frame neighborhood.

# src/render/IAutoMovieCaptureWindow.ts#IAutoMovieCaptureWindow.frame

## @evidence contracts/development/common.md#meaningful-documentation

Names the nearest actual native index, including the terminal clamp.
