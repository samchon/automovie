# src/motion/human/capture/IAutoMovieMotionHumanMotionCaptureOverlays.ts#IAutoMovieMotionHumanMotionCaptureOverlays

## @evidence contracts/development/design.md#principled-representation

Each overlay is the plain data its producer measured: a polyline, a point with the radius it was aimed within, and samples with a drift and a limit in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members the mapping reads; figures, boxes and verdicts stay with the harness.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's vector; a drift is compared with its own set's limit, so no global limit exists.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member holds, its frame, units and who reads it.
