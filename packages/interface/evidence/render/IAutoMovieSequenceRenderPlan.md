# src/render/IAutoMovieSequenceRenderPlan.ts#IAutoMovieSequenceRenderPlan

## @evidence contracts/development/design.md#principled-representation

The manifest binds a sequence target to editorial and output fps, resolved spans, exact sample metadata, paths and encoding arguments from one planning call.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Captures consume one complete manifest rather than independently deriving frame names, transitions and local shot times.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record preserves both frame clocks instead of pretending a render fps override changes the authored cut.

## @evidence contracts/development/common.md#meaningful-documentation

Members document seconds, fps roles, encode ordering, first and last paths and the shared ffmpeg argument vector.
