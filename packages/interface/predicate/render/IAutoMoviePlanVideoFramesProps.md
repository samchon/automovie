# src/render/IAutoMoviePlanVideoFramesProps.ts#IAutoMoviePlanVideoFramesProps

## @evidence contracts/development/common.md#meaningful-documentation

Names one file, a decoded frame selection, output folder and source-clock option.

## @evidence contracts/development/design.md#principled-representation

Absolute stream selection is optional and uses the first video stream when absent. The presentation option enables the raw timing log without changing the selected indices or output numbering.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The planner needs selected decoded indices, the path of the supplied file and one output location. The process host owns decoding and evidence admission.

# src/render/IAutoMoviePlanVideoFramesProps.ts#IAutoMoviePlanVideoFramesProps.streamIndex

## @evidence contracts/development/common.md#meaningful-documentation

Defines the absolute input stream and the established first video fallback.

# src/render/IAutoMoviePlanVideoFramesProps.ts#IAutoMoviePlanVideoFramesProps.presentation

## @evidence contracts/development/common.md#meaningful-documentation

Preserves input timestamps and asks FFmpeg to log timing for the selected PNGs only.
