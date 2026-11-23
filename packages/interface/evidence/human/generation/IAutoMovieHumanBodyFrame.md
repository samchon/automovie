# src/human/generation/IAutoMovieHumanBodyFrame.ts#IAutoMovieHumanBodyFrame.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

Calibration-mm AP datums, with +X forward, +Y up and +Z left.

## @evidence contracts/development/design.md#principled-representation `cervicale`: Registered C7 skin datum relative to the ankle midpoint. `perineum`: Shared lower-body sagittal datum, at the original perineal pole.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyFrame.create. Also types AutoMovieHumanBodyLaneInterim.placed, AutoMovieHumanBodySources.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `cervicale`, `perineum`; callers supply the complete record.
